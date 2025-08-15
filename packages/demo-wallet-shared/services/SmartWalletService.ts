import { PasskeyService } from "./PasskeyService";
import {
  Address,
  Asset,
  authorizeEntry,
  hash,
  Keypair,
  nativeToScVal,
  Operation,
  StrKey,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Client } from "@stellar/stellar-sdk/contract";
import {
  SendTxStatus,
  SOROBAN_CONFIG,
  SOURCE_KEYPAIR_SECRET,
} from "../constants/soroban";
import base64url from "base64url";
import {
  Api,
  BasicSleepStrategy,
  parseRawSimulation,
  Server,
} from "@stellar/stellar-sdk/rpc";
import { getNetworkConfig } from "../helpers/getNetworkConfig";
import { getWalletBackendEndpoint } from "../helpers/getWalletBackendEndpoint";

export class SmartWalletService {
  private static instance: SmartWalletService;
  private passkeyService: PasskeyService;
  private readonly sourceKeypair: Keypair;
  private server: Server;
  private readonly networkPassphrase: string;

  public static getInstance(): SmartWalletService {
    if (!SmartWalletService.instance) {
      SmartWalletService.instance = new SmartWalletService();
    }
    return SmartWalletService.instance;
  }

  constructor() {
    this.passkeyService = new PasskeyService();
    this.sourceKeypair = Keypair.fromSecret(SOURCE_KEYPAIR_SECRET);
    this.server = new Server(getNetworkConfig().rpcUrl);
    this.networkPassphrase = getNetworkConfig().rpcNetwork;
  }

  public async createPasskeyContract(passkeyName: string) {
    // 1. Register passkey
    const { pkId, pk } = await this.passkeyService.registerPasskey(passkeyName);

    // 2. Build deploy transaction
    const deployTx = await Client.deploy(
      {
        credential_id: base64url.toBuffer(pkId),
        public_key: pk,
      },
      {
        networkPassphrase: this.networkPassphrase,
        rpcUrl: getNetworkConfig().rpcUrl,
        wasmHash: SOROBAN_CONFIG.WASM_HASH,
        salt: hash(base64url.toBuffer(pkId)),
        publicKey: this.sourceKeypair.publicKey(),
      }
    );

    // 3. Sign with source keypair
    const result = await this.signTxWithSourceKeypair(deployTx.toXDR());
    const resultJson = await result.json();
    const signedTx =
      TransactionBuilder.fromXDR(resultJson.signed_tx, this.networkPassphrase);

    // 4. Submit the transaction
    const sendResponse = await this.server.sendTransaction(signedTx);
    if (sendResponse.errorResult) {
      throw new Error(sendResponse.errorResult.result().toString());
    }

    if (sendResponse.status === SendTxStatus.Pending) {
      await this.server.pollTransaction(
        sendResponse.hash,
        {
          attempts: 100,
          sleepStrategy: BasicSleepStrategy,
        }
      );
    } else {
      throw new Error(
        `Error happened during deploy: ${sendResponse}`,
      );
    }

    // 5. Poll for transaction status
    let getResponse = await this.server.getTransaction(sendResponse.hash);
    if (getResponse.status === Api.GetTransactionStatus.SUCCESS) {
      const contractId = Address.fromScVal(getResponse.returnValue!).toString();
      console.log("Contract Deployed: " + contractId);
      return {
        contractId,
        pkId,
      };
    }

    throw new Error(`Failed to deploy: ${getResponse}`);
  }

  public async connectPasskeyContract() {
    // 1. connect passkey
    const pkId = await this.passkeyService.connectPasskey();
    if (!pkId) {
      throw new Error("No `keyId` was found");
    }

    // 2. retrieve the contractId through the networkId, pkId, and deployer address
    const preimage = xdr.HashIdPreimage.envelopeTypeContractId(
      new xdr.HashIdPreimageContractId({
        networkId: hash(Buffer.from(this.networkPassphrase)),
        contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
          new xdr.ContractIdPreimageFromAddress({
            address: Address.fromString(this.sourceKeypair.publicKey()).toScAddress(),
            salt: hash(base64url.toBuffer(pkId)),
          }),
        ),
      }),
    );
    const contractId = StrKey.encodeContract(hash(preimage.toXDR()));
    console.log("Contract Connected: " + contractId);

    return {
      contractId,
      pkId,
    }
  }

  public async fetchBalance(
    contractId: string,
    assetCode: string,
    assetIssuer: string,
  ) {
    const asset = assetCode === "XLM"
      ? Asset.native()
      : new Asset(assetCode, assetIssuer);

    try {
      const balance = await this.server.getSACBalance(
        contractId,
        asset,
        this.networkPassphrase,
      );

      const balanceAmount = balance?.balanceEntry?.amount
        ? (Number(balance.balanceEntry.amount) / SOROBAN_CONFIG.ONE).toString()
        : "0";
      return {
        type: asset.getAssetType(),
        balance: balanceAmount,
      }
    } catch (error: any) {
      // Return zero balance if fetching fails for a specific asset
      return {
        type: asset.getAssetType(),
        balance: "0",
      };
    }
  }

  public async fundContractWithXLM(contractId: string) {
    const fromAcc = await this.generateFundedKeypair();
    return await this.transfer(
      Asset.native().contractId(this.networkPassphrase),
      fromAcc.publicKey(),
      contractId,
      9999,
      fromAcc
    );
  }

  public async transfer (
    assetContract: string,
    fromAcc: string,
    toAcc: string,
    amount: number,
    signer: Keypair | string,
  ) {
    const sourceAcc = await this.server.getAccount(this.sourceKeypair.publicKey());

    // 1. Build transaction
    const tx = new TransactionBuilder(
      sourceAcc,
      {
        networkPassphrase: this.networkPassphrase,
        fee: SOROBAN_CONFIG.MAX_FEE
      })
      .addOperation(Operation.invokeContractFunction({
        contract: assetContract,
        function: 'transfer',
        args: [
          nativeToScVal(fromAcc, { type: 'address' }), // from
          nativeToScVal(toAcc, { type: 'address' }),  // to
          nativeToScVal(amount * SOROBAN_CONFIG.ONE, { type: 'i128' }) // amount
        ],
      }))
      .setTimeout(300)
      .build();

    // 2. Simulate transaction
    const simulatedTx = await this.server.simulateTransaction(tx);
    if (!Api.isSimulationSuccess(simulatedTx)) {
      throw new Error(simulatedTx.error);
    }

    // 3. Sign auth entries
    if (signer instanceof Keypair) {
      simulatedTx.result!.auth =
        await Promise.all(simulatedTx.result?.auth?.map(entry =>
          this.signWithClassicAccount(entry, signer, simulatedTx.latestLedger + 60)
        ) ?? []
        );
    } else {
      simulatedTx.result!.auth =
        await Promise.all(simulatedTx.result?.auth?.map(entry =>
          this.signWithContractAccount(entry, simulatedTx.latestLedger + 60)
        ) ?? []
        );
    }

    // 4. Assemble the transaction with signed auth entries
    let preppedTx = await this.assembleTransaction(tx, simulatedTx);

    // 5. Simulate and assemble again to update the resource for custom auth check
    const simulatedAgain = await this.server.simulateTransaction(preppedTx);
    if (!Api.isSimulationSuccess(simulatedAgain)) {
      throw new Error(simulatedAgain.error);
    }
    preppedTx = await this.assembleTransaction(preppedTx, simulatedAgain);

    // 6. Sign the transaction with the source keypair
    const result = await this.signTxWithSourceKeypair(preppedTx.toXDR());
    const resultJson = await result.json();
    const signedTx =
      TransactionBuilder.fromXDR(resultJson.signed_tx, this.networkPassphrase);

    // 7. Submit the transaction
    const response = await this.server.sendTransaction(signedTx);
    if (response.errorResult) {
      throw new Error(response.errorResult.result().toString());
    }

    if (response.status === SendTxStatus.Pending) {
      return await this.server.pollTransaction(
        response.hash,
        {
          attempts: 100,
          sleepStrategy: BasicSleepStrategy,
        }
      );
    } else {
      throw new Error(
        `Failed to submit transaction, status: ${response}`,
      );
    }
  }

  public async signWithClassicAccount (
    unsignedEntry: xdr.SorobanAuthorizationEntry,
    signer: Keypair,
    validUntilLedgerSeq: number
  ) {
    // return signed auth entries
    return await authorizeEntry(unsignedEntry, signer, validUntilLedgerSeq, this.networkPassphrase)
  }

  public async signWithContractAccount (
    unsignedEntry: xdr.SorobanAuthorizationEntry,
    validUntilLedgerSeq: number
  ) {
    const entry = xdr.SorobanAuthorizationEntry.fromXDR(unsignedEntry.toXDR());
    const addrAuth = entry.credentials().address();

    addrAuth.signatureExpirationLedger(validUntilLedgerSeq);

    const preimage = xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
      new xdr.HashIdPreimageSorobanAuthorization({
        networkId: hash(Buffer.from(this.networkPassphrase)),
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
          key: xdr.ScVal.scvSymbol("authenticator_data"),
          val: xdr.ScVal.scvBytes(base64url.toBuffer(authenticationResponse.response.authenticatorData))
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("client_data_json"),
          val: xdr.ScVal.scvBytes(base64url.toBuffer(authenticationResponse.response.clientDataJSON))
        }),
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

  async signTxWithSourceKeypair(
    txXDR: string,
  ) {
    const params = {
      unsigned_tx: txXDR,
      network_passphrase: this.networkPassphrase,
    };
    const urlParams = new URLSearchParams(params);
    const walletBackendSignEndpoint = `${getWalletBackendEndpoint()}/sign-tx`;
    return await fetch(walletBackendSignEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlParams.toString(),
    });
  }

  /**
   * Assembles a final `Transaction` from a base transaction and its simulation response.
   *
   * This is a simplified version of the `assembleTransaction()` method in `js-stellar-sdk`,
   * tailored specifically for demo wallet transfer functionality using Soroban invokeHostFunction.
   *
   * ⚠️ WARNING: Do not use this function unless you fully understand the implications.
   * It bypasses certain validations and assumptions made in the official SDK. This is meant for
   * internal demo use only.
   *
   * @param tx - The base transaction to be assembled upon. Should contain a Soroban `invokeHostFunction` operation.
   * @param simResponse - The result of simulating the transaction, containing signed auth entries if required.
   * @returns A fully assembled `Transaction` ready submission.
   */
  private async assembleTransaction(
    tx: Transaction,
    simResponse: Api.SimulateTransactionResponse
  ) {
    const success = parseRawSimulation(simResponse);
    if (!Api.isSimulationSuccess(success)) {
      throw new Error(`simulation incorrect: ${JSON.stringify(success)}`);
    }
    const classicFeeNum = parseInt(tx.fee) || 0;
    const minResourceFeeNum = parseInt(success.minResourceFee) || 0;
    const txnBuilder = TransactionBuilder.cloneFrom(tx, {
      fee: (classicFeeNum + minResourceFeeNum).toString(),
      sorobanData: success.transactionData.build(),
      networkPassphrase: tx.networkPassphrase
    });

    if (tx.operations[0].type === 'invokeHostFunction') {
      // In this case, we don't want to clone the operation, so we drop it.
      txnBuilder.clearOperations();

      const invokeOp: Operation.InvokeHostFunction = tx.operations[0];
      const existingAuth = invokeOp.auth ?? [];
      txnBuilder.addOperation(
        Operation.invokeHostFunction({
          source: invokeOp.source,
          func: invokeOp.func,
          auth: existingAuth.length > 0 ? existingAuth : success.result!.auth
        })
      );
    }
    return txnBuilder.build();
  }

  private async generateFundedKeypair() {
    const keypair = Keypair.random();
    await this.server.requestAirdrop(keypair.publicKey());
    return keypair;
  }
}