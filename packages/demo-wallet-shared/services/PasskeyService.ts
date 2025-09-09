import {
  AuthenticatorAttestationResponseJSON,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import * as cbor from "cbor";
import crypto from "crypto";
import base64url from "base64url";

const DEMO_WALLET_NAME = "Stellar Demo Wallet";

export class PasskeyService {
  private static instance: PasskeyService;
  public domain: string;

  public static getInstance(): PasskeyService {
    if (!PasskeyService.instance) {
      PasskeyService.instance = new PasskeyService();
    }

    return PasskeyService.instance;
  }

  constructor() {
    // Guard against server-side usage
    if (typeof window === 'undefined') {
      throw new Error('PasskeyService can only be used in browser environments');
    }
    this.domain = window.location.hostname;
  }

  public async registerPasskey(passkeyName: string) {
    const displayName = `${passkeyName} — ${new Date().toLocaleString()}`
    const { id, response } = await startRegistration({
      optionsJSON: {
        rp: {
          id: this.domain,
          name: DEMO_WALLET_NAME,
        },
        user: {
          id: base64url(passkeyName),
          name: displayName,
          displayName: displayName,
        },
        challenge: base64url(crypto.randomBytes(32)),
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },    // ES256 (ECDSA w/ SHA-256)
          { type: "public-key", alg: -257 },  // RS256 (RSASSA-PKCS1-v1_5 w/ SHA-256)
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      }
    });

    return {
      pkId: id,
      pk: this.getPublicKey(response),
    };
  }

  // The publicKey field will be missing if pubKeyCredParams was used to
  // negotiate a public-key algorithm that the user agent doesn't understand.
  // If using such an algorithm then the public key must be parsed directly
  // from attestationObject or authenticatorData.
  private getPublicKey (response: AuthenticatorAttestationResponseJSON) {
    if (response.publicKey) {
      // If publicKey is provided directly, decode it
      let publicKey = base64url.toBuffer(response.publicKey);
      publicKey = publicKey.slice(publicKey.length - 65); // Ensure we get the last 65 bytes
      return publicKey;
    }

    let authData
    if (response.authenticatorData) {
      authData = base64url.toBuffer(response.authenticatorData);
    } else if (response.attestationObject) {
      const attObj = cbor.decodeFirstSync(base64url.toBuffer(response.attestationObject));
      authData = attObj.authData;
    } else {
      throw new Error('No valid WebAuthn data found');
    }

    if (authData.length < 55) throw new Error('Invalid authData');
    if (!(authData[32] & 0x40)) throw new Error('No attested credential')

    // 3. Parse credential public key
    const credentialIdLength = authData.readUInt16BE(53);
    const publicKeyCOSE = authData.slice(55 + credentialIdLength);
    const decodedKey = cbor.decodeFirstSync(publicKeyCOSE);

    // 4. Validate key structure
    if (
      decodedKey.get(1) !== 2 ||
      decodedKey.get(3) !== -7 ||
      decodedKey.get(-1) !== 1
    ) throw new Error('Unsupported key type');

    // 5. Extract coordinates
    const x = decodedKey.get(-2);
    const y = decodedKey.get(-3);

    if (!x || !y || x.length !== 32 || y.length !== 32) {
      throw new Error('Invalid elliptic curve coordinates');
    }

    // 6. Create uncompressed SEC1 format
    return Buffer.concat([Buffer.from([0x04]), x, y]);
  }

  public async connectPasskey() {
    const { id } = await startAuthentication({
      optionsJSON: {
        challenge: base64url(crypto.randomBytes(32)),
        rpId: this.domain
      }
    });
    return id;
  }

  public async signPayload(payload: Buffer) {
    const authenticationResponse = await startAuthentication({
      optionsJSON: {
        challenge: base64url(payload),
        rpId: this.domain,
      },
    });

    const compactSignature = this.compactSignature(base64url.toBuffer(authenticationResponse.response.signature));
    return { authenticationResponse, compactSignature };
  }

  /**
   * Converts a DER-encoded ECDSA signature into a raw, canonicalized 64-byte (r || s) signature.
   *
   * This method:
   * - Extracts the `r` and `s` values from the ASN.1 DER-encoded signature.
   * - Ensures the `s` value is in its "low-S" form, as required by standards like BIP-62 and Stellar.
   * - Pads `r` and `s` to 32 bytes each if needed.
   * - Returns the concatenation of `r || s`, forming a 64-byte compact signature.
   *
   * This is required when submitting signatures to systems like Stellar or Soroban,
   * which enforce low-S signatures and expect raw `r || s` format instead of DER encoding.
   */
  private compactSignature(signature: Buffer) {
    // Decode the DER signature
    let offset = 2;

    const rLength = signature[offset + 1];
    const r = signature.slice(offset + 2, offset + 2 + rLength);

    offset += 2 + rLength;

    const sLength = signature[offset + 1];
    const s = signature.slice(offset + 2, offset + 2 + sLength);

    // Convert r and s to BigInt
    const rBigInt = BigInt("0x" + r.toString("hex"));
    let sBigInt = BigInt("0x" + s.toString("hex"));

    // Ensure s is in the low-S form
    // https://github.com/stellar/stellar-protocol/discussions/1435#discussioncomment-8809175
    // https://discord.com/channels/897514728459468821/1233048618571927693
    // Define the order of the curve secp256r1
    // https://github.com/RustCrypto/elliptic-curves/blob/master/p256/src/lib.rs#L72
    const n = BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551");
    const halfN = n / 2n;

    if (sBigInt > halfN) sBigInt = n - sBigInt;

    // Convert back to buffers and ensure they are 32 bytes
    const rPadded = Buffer.from(rBigInt.toString(16).padStart(64, "0"), "hex");
    const sLowS = Buffer.from(sBigInt.toString(16).padStart(64, "0"), "hex");

    // Concatenate r and low-s
    return Buffer.concat([rPadded, sLowS]);
  }
}