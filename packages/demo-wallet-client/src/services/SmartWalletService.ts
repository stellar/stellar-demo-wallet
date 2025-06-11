import { PasskeyService } from "./PasskeyService";
import {
  Address, Asset, authorizeEntry,
  hash,
  Keypair, nativeToScVal, Networks, Operation,
  StrKey,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Client, basicNodeSigner } from "@stellar/stellar-sdk/contract";
import {
  GetTxStatus,
  SendTxStatus,
  SOROBAN_CONFIG,
  SOURCE_KEYPAIR_SECRET,
} from "../config/constants";
import base64url from "base64url";
import { Api, Server } from "@stellar/stellar-sdk/rpc";
import { SigningCallback } from "@stellar/stellar-base";

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
    const signedEntries = await Promise.all(simulatedTx.result?.auth?.map(entry =>
      authorizeEntry(entry, signer, simulatedTx.latestLedger + 600, Networks.TESTNET)
    ) ?? []
    );

    // Step 4: Simulate again to get updated resources
    const rawOp = tx.operations[0] as Operation.InvokeHostFunction;
    const readyTx = TransactionBuilder.cloneFrom(tx)
      .clearOperations()
      .addOperation(
        Operation.invokeHostFunction({
          ...rawOp,
          auth: signedEntries,
        }),
      ).build()

    // Step 5: Prepare the transaction
    const preppedTx = await this.server.prepareTransaction(readyTx)
    preppedTx.sign(this.sourceKeypair);

    // Step 6: Send the transaction
    const response = await this.server.sendTransaction(preppedTx);
    if (response.errorResult) {
      throw new Error(response.errorResult.result().toString());
    }

    if (response.status === SendTxStatus.Pending) {
      let txResponse = await this.server.getTransaction(response.hash);

      // Poll this until the status is not "NOT_FOUND"
      while (txResponse.status === GetTxStatus.NotFound) {
        // See if the transaction is complete, else wait a second
        txResponse = await this.server.getTransaction(response.hash);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return response;
    } else {
      throw new Error(
        `Unabled to submit transaction, status: ${response.status}`,
      );
    }
  }

  private async generateFundedKeypair() {
    const keypair = Keypair.random();
    await this.server.requestAirdrop(keypair.publicKey());
    return keypair;
  }
}