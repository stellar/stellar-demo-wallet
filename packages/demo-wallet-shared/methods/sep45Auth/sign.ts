import {
  Address, authorizeEntry, BASE_FEE,
  hash, Keypair, Networks, Operation, StrKey, TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Api, Server } from "@stellar/stellar-sdk/rpc";
import {
  SOROBAN_CONFIG,
  SOURCE_KEYPAIR_SECRET,
} from "demo-wallet-client/src/config/constants";
import { PasskeyService } from "demo-wallet-client/src/services/PasskeyService";
import * as xdrParser from "@stellar/js-xdr";
import base64url from "base64url";

const server = new Server(SOROBAN_CONFIG.RPC_URL);

export const sign = async ({
  authEntries,
  clientAccount,
  expectedArgs,
  serverSigningKey,
  webAuthContractId,
} : {
  authEntries: string,
  clientAccount: string,
  expectedArgs: Record<string, string>,
  serverSigningKey: string,
  webAuthContractId: string,
}) => {
  const decodedEntries = decodeAuthorizationEntries(authEntries);

  const signedEntries = await Promise.all(
    decodedEntries.map(async (entry) => {
      // validate entry general info
      validateEntryGeneralInfo(entry, expectedArgs, webAuthContractId);

      // Validate Server Account and signature from the Server Account
      const isServerEntry =
        entry.credentials().address().address().switch().value ===
        xdr.ScAddressType.scAddressTypeAccount().value;
      if(isServerEntry) {
        validateServerEntryAndSignature(entry, serverSigningKey);
      }

      // Sign auth entry
      const isAuthEntry =
        entry.credentials().address().address().switch().value ===
        xdr.ScAddressType.scAddressTypeContract().value;
      if(isAuthEntry) {
        return authorizeEntryWithPasskeyService(entry);
      }

      // Sign client domain entry
      if(clientAccount && Address.fromScAddress(
          entry.credentials().address().address(),
        ).toString() === clientAccount) {
        return authorizeClientDomainEntry(entry)
      }

      return entry;
    })
  );

  // Reconstruct op and simulate tx
  const op = Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeInvokeContract(
      new xdr.InvokeContractArgs({
        contractAddress: new Address(webAuthContractId).toScAddress(),
        functionName: "web_auth_verify",
        args: signedEntries[0].rootInvocation().function().contractFn().args()
      }),
    ),
    auth: signedEntries,
  });

  const sourceKeypair = Keypair.fromSecret(SOURCE_KEYPAIR_SECRET);
  const sourceAcc = await server.getAccount(sourceKeypair.publicKey());

  const tx = new TransactionBuilder(sourceAcc, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET, // or mainnet if needed
  })
    .addOperation(op)
    .setTimeout(300)
    .build();

  const simulateTxResponse = await server.simulateTransaction(tx);
  if (Api.isSimulationError(simulateTxResponse)) {
    throw new Error(simulateTxResponse.error);
  }

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

function validateEntryGeneralInfo(
  entry: xdr.SorobanAuthorizationEntry,
  expectedArgs: Record<string, string>,
  webAuthContractId: string,
) {
  // 1. No sub_invocations
  if (entry.rootInvocation().subInvocations().length) {
    throw new Error("Transfer authorizes sub-invocations to another contract");
  }

  // 2. contract_address matches the WEB_AUTH_CONTRACT_ID
  const contractFn = entry.rootInvocation().function().contractFn()
  const contractId = Address.contract(contractFn.contractAddress().contractId()).toString();
  if (contractId !== webAuthContractId) {
    throw new Error(`contractId is invalid! Expected: ${webAuthContractId} but got: ${contractId}`);
  }

  // 3.function_name is web_auth_verify
  const fnName = contractFn.functionName().toString();
  if (fnName !== "web_auth_verify") {
      throw new Error(`Function name is invalid! Expected: web_auth_verify but got: ${fnName}`);
  }

  // 4. Args map match the expected values and is the same across all authorization entries:
  const argEntries = contractFn.args()[0].map()!;
  const actualArgs: Record<string, string> = Object.fromEntries(
    argEntries.map((entry) => [
      entry.key().sym().toString(),
      entry.val().str().toString(),
    ])
  );

  for (const [key, expectedVal] of Object.entries(expectedArgs)) {
    const actualVal = actualArgs[key];
    if (actualVal === undefined) {
      throw new Error(`Missing expected arg: "${key}"`);
    }
    if (actualVal !== expectedVal) {
      throw new Error(`Value mismatch for "${key}": expected "${expectedVal}", got "${actualVal}"`);
    }
  }
}

function validateServerEntryAndSignature (
  entry: xdr.SorobanAuthorizationEntry,
  serverSigningKey: string,
) {
  const rawPublicKey = entry.credentials().address().address().accountId();
  const signingKey = StrKey.encodeEd25519PublicKey(rawPublicKey.ed25519());

  if (signingKey !== serverSigningKey ) {
    throw new Error(`server signing key is invalid! Expected: ${serverSigningKey} but got: ${signingKey}`);
  }

  const signatures = entry.credentials().address().signature().vec()!;
  const signature = signatures[0].map()![1].val().bytes()

  const preimage = xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
    new xdr.HashIdPreimageSorobanAuthorization({
      networkId: hash(Buffer.from(Networks.TESTNET)),
      nonce:entry.credentials().address().nonce(),
      invocation:entry.rootInvocation(),
      signatureExpirationLedger: entry.credentials().address().signatureExpirationLedger(),
    }),
  );
  const payload = hash(preimage.toXDR());

  const serverKP = Keypair.fromPublicKey(serverSigningKey);
  const isSigCorrect = serverKP.verify(payload, signature);

  if (!isSigCorrect) {
    throw new Error("server signature is invalid");
  }
}

async function authorizeClientDomainEntry(
  unsignedEntry: xdr.SorobanAuthorizationEntry,
): Promise<xdr.SorobanAuthorizationEntry> {
  const validUntilLedgerSeq = (await server.getLatestLedger()).sequence + 60;

  const SERVER_SIGNING_KEY = String(process.env.SERVER_SIGNING_KEY);

  return authorizeEntry(unsignedEntry, Keypair.fromSecret(SERVER_SIGNING_KEY), validUntilLedgerSeq, Networks.TESTNET)
}

async function authorizeEntryWithPasskeyService (
  unsignedEntry: xdr.SorobanAuthorizationEntry,
): Promise<xdr.SorobanAuthorizationEntry> {
  const entry = xdr.SorobanAuthorizationEntry.fromXDR(unsignedEntry.toXDR());
  const addrAuth = entry.credentials().address();

  const validUntilLedgerSeq = (await server.getLatestLedger()).sequence + 60;
  addrAuth.signatureExpirationLedger(validUntilLedgerSeq);

  const preimage = xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
    new xdr.HashIdPreimageSorobanAuthorization({
      networkId: hash(Buffer.from(Networks.TESTNET)),
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