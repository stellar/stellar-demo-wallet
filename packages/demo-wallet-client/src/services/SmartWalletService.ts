import { PasskeyService } from "./PasskeyService";
import {
  Address,
  Asset,
  authorizeEntry,
  hash,
  Keypair,
  nativeToScVal,
  Networks,
  Operation,
  SigningCallback,
  StrKey,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { basicNodeSigner, Client } from "@stellar/stellar-sdk/contract";
import {
  SendTxStatus,
  SOROBAN_CONFIG,
  SOURCE_KEYPAIR_SECRET,
} from "../config/constants";
import base64url from "base64url";
import {
  Api,
  BasicSleepStrategy,
  parseRawSimulation,
  Server,
} from "@stellar/stellar-sdk/rpc";

export class SmartWalletService {
  private static instance: SmartWalletService;
  private passkeyService: PasskeyService;
  private readonly sourceKeypair: Keypair;
  private server: Server;

  public static getInstance(): SmartWalletService {
    if (!SmartWalletService.instance) {
      SmartWalletService.instance = new SmartWalletService();
    }
    return SmartWalletService.instance;
  }

  constructor() {
    this.passkeyService = new PasskeyService();
    this.sourceKeypair = Keypair.fromSecret(SOURCE_KEYPAIR_SECRET);
    this.server = new Server(SOROBAN_CONFIG.RPC_URL);
  }

  public async createPasskeyContract(passkeyName: string) {
    // 1. Register passkey
    const { pkId, pk } = await this.passkeyService.registerPasskey(passkeyName);

    // 2. Deploy contract
    const { signTransaction } = basicNodeSigner(this.sourceKeypair, Networks.TESTNET);
    const deployTx = await Client.deploy(
      {
        credential_id: pkId,
        public_key: pk,
      },
      {
        networkPassphrase: Networks.TESTNET,
        rpcUrl: SOROBAN_CONFIG.RPC_URL,
        wasmHash: SOROBAN_CONFIG.WASM_HASH,
        salt: hash(base64url.toBuffer(pkId)),
        publicKey: this.sourceKeypair.publicKey(),
        signTransaction,
      }
    );

    const { result: client } = await deployTx.signAndSend();
    const contractId = client.options.contractId;
    console.log("Contract Deployed: " + contractId);

    return {
      contractId,
      pkId,
    };
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
        networkId: hash(Buffer.from(Networks.TESTNET,)),
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
        Networks.TESTNET
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
      Asset.native().contractId(Networks.TESTNET),
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
    signer: Keypair | SigningCallback,
  ) {
    const sourceAcc = await this.server.getAccount(this.sourceKeypair.publicKey());

    // 1. Build transaction
    const tx = new TransactionBuilder(
      sourceAcc,
      {
        networkPassphrase: Networks.TESTNET,
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
    if (Api.isSimulationError(simulatedTx)) {
      throw new Error(simulatedTx.error);
    }

    // 3. Sign auth entries
    simulatedTx.result!.auth = await Promise.all(simulatedTx.result?.auth?.map(entry =>
      authorizeEntry(entry, signer, simulatedTx.latestLedger + 60, Networks.TESTNET)
    ) ?? []
    );

    // 4. Assemble the transaction with signed auth entries
    const preppedTx = await this.assembleTransaction(tx, simulatedTx);
    preppedTx.sign(this.sourceKeypair);

    // 5: Send the transaction
    const response = await this.server.sendTransaction(preppedTx);
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
        `Unabled to submit transaction, status: ${response.status}`,
      );
    }
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