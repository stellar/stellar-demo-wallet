import {
  hash,
  Networks,
  xdr,
} from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import { SOROBAN_CONFIG } from "demo-wallet-client/src/config/constants";
import { PasskeyService } from "demo-wallet-client/src/services/PasskeyService";
import * as xdrParser from "@stellar/js-xdr";

export const sign = async ({
  authEntries,
} : {
  authEntries: string,
}) => {

  // Decode and find the web auth entry
  const decodedEntries = decodeAuthorizationEntries(authEntries);
  const authEntry = decodedEntries.find(
    entry =>
      entry.credentials().address().address().switch().value === xdr.ScAddressType.scAddressTypeContract().value
  );
  if (!authEntry) {
    throw new Error("Contract auth entry not found in challenge response");
  }

  // TODO: client domain auth

  // Sign auth entry
  const server = new Server(SOROBAN_CONFIG.RPC_URL);
  const validUntilLedgerSeq = (await server.getLatestLedger()).sequence + 60;

  const addrAuth = authEntry.credentials().address();
  addrAuth.signatureExpirationLedger(validUntilLedgerSeq);

  const networkId = hash(Buffer.from(Networks.TESTNET));
  const preimage = xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
    new xdr.HashIdPreimageSorobanAuthorization({
      networkId,
      nonce: addrAuth.nonce(),
      invocation: authEntry.rootInvocation(),
      signatureExpirationLedger: addrAuth.signatureExpirationLedger(),
    }),
  );

  const { authenticationResponse, compactSignature } = await PasskeyService.getInstance().signPayload(preimage.toXDR());

  addrAuth.signature(
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("authenticator_data"),
        val: xdr.ScVal.scvBytes(Buffer.from(authenticationResponse.response.authenticatorData)),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("client_data_json"),
        val: xdr.ScVal.scvBytes(Buffer.from(authenticationResponse.response.clientDataJSON)),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("id"),
        val: xdr.ScVal.scvBytes(Buffer.from(authenticationResponse.id)),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("signature"),
        val: xdr.ScVal.scvBytes(compactSignature),
      }),
    ]),
  );

  return encodeAuthorizationEntries(decodedEntries);
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