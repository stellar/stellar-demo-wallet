import {
  Address, authorizeEntry,
  hash, Keypair, Networks,
  xdr,
} from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import { SOROBAN_CONFIG } from "demo-wallet-client/src/config/constants";
import { PasskeyService } from "demo-wallet-client/src/services/PasskeyService";
import * as xdrParser from "@stellar/js-xdr";
import base64url from "base64url";
import { getNetworkConfig } from "../../helpers/getNetworkConfig";

export const sign = async ({
  authEntries,
  clientAccount,
} : {
  authEntries: string,
  clientAccount: string | undefined,
}) => {
  const decodedEntries = decodeAuthorizationEntries(authEntries);

  const signedEntries = await Promise.all(
    decodedEntries.map(async (entry) => {
      const isAuthEntry =
        entry.credentials().address().address().switch().value ===
        xdr.ScAddressType.scAddressTypeContract().value;

      if(isAuthEntry) {
        return authorizeEntryWithPasskeyService(entry);
      }

      if(clientAccount && Address.fromScAddress(
          entry.credentials().address().address(),
        ).toString() === clientAccount) {
        return authorizeClientDomainEntry(entry)
      }

      return entry;
    })
  );

  return encodeAuthorizationEntries(signedEntries);
}

function decodeAuthorizationEntries(base64: string): xdr.SorobanAuthorizationEntry[] {
  try {
    const buffer = Buffer.from(base64, "base64");
    const authEntriesType = new xdrParser.VarArray(
      xdr.SorobanAuthorizationEntry,
      3,
    );
    const reader = new xdrParser.XdrReader(buffer);
    return authEntriesType.read(reader);
  } catch (err) {
    throw new Error(`Invalid SorobanAuthorizationEntry data: ${err}`);
  }
}

function encodeAuthorizationEntries(entries: xdr.SorobanAuthorizationEntry[]): string {
  try {
    const authEntriesType = new xdrParser.VarArray(xdr.SorobanAuthorizationEntry, 3);
    const writer = new xdrParser.XdrWriter();
    authEntriesType.write(entries, writer);
    const buffer = writer.finalize();
    return buffer.toString("base64");
  } catch (err) {
    throw new Error(`Failed to encode SorobanAuthorizationEntry array: ${err}`);
  }
}

async function authorizeClientDomainEntry(
  unsignedEntry: xdr.SorobanAuthorizationEntry,
): Promise<xdr.SorobanAuthorizationEntry> {
  const server = new Server(SOROBAN_CONFIG.RPC_URL);
  const validUntilLedgerSeq = (await server.getLatestLedger()).sequence + 60;

  const SERVER_SIGNING_KEY = String(process.env.SERVER_SIGNING_KEY);

  return authorizeEntry(unsignedEntry, Keypair.fromSecret(SERVER_SIGNING_KEY), validUntilLedgerSeq, Networks.TESTNET)
}

async function authorizeEntryWithPasskeyService (
  unsignedEntry: xdr.SorobanAuthorizationEntry,
): Promise<xdr.SorobanAuthorizationEntry> {
  const entry = xdr.SorobanAuthorizationEntry.fromXDR(unsignedEntry.toXDR());
  const addrAuth = entry.credentials().address();

  const server = new Server(SOROBAN_CONFIG.RPC_URL);
  const validUntilLedgerSeq = (await server.getLatestLedger()).sequence + 60;
  addrAuth.signatureExpirationLedger(validUntilLedgerSeq);

  const preimage = xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
    new xdr.HashIdPreimageSorobanAuthorization({
      networkId: hash(Buffer.from(getNetworkConfig().network)),
      nonce: addrAuth.nonce(),
      signatureExpirationLedger: addrAuth.signatureExpirationLedger(),
      invocation: entry.rootInvocation(),
    }),
  );
  const payload = hash(preimage.toXDR());

  const { authenticationResponse, compactSignature } = await PasskeyService.getInstance().signPayload(payload);

  addrAuth.signature(
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("credential_id"),
        val: xdr.ScVal.scvBytes(base64url.toBuffer(authenticationResponse.id)),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("signature"),
        val: xdr.ScVal.scvBytes(compactSignature),
      }),
    ]),
  );

  return entry;
}