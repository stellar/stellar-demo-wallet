import { startRegistration } from "@simplewebauthn/browser";

import {
  AuthenticatorAttestationResponseJSON
} from "@simplewebauthn/browser/esm/types";
import * as cbor from 'cbor';
import crypto from "crypto";
import base64url from "base64url";

const DEMO_WALLET_DOMAIN = "localhost";
const DEMO_WALLET_NAME = "Stellar Demo Wallet";

export class PasskeyService {
  public domain: string;

  constructor() {
    this.domain = DEMO_WALLET_DOMAIN
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
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
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
      pk: await this.getPublicKey(response),
    };
  }

  // The publicKey field will be missing if pubKeyCredParams was used to
  // negotiate a public-key algorithm that the user agent doesn't understand.
  // If using such an algorithm then the public key must be parsed directly
  // from attestationObject or authenticatorData.
  private async getPublicKey (response: AuthenticatorAttestationResponseJSON) {
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
    const publicKeyCOSE = authData.slice( 55 + credentialIdLength);
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
    return [Buffer.from([0x04]), x, y];
  }
}