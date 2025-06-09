import { PasskeyService } from "./PasskeyService";
import {
  Address, Asset,
  hash,
  Keypair, nativeToScVal, Networks, Operation,
  StrKey,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
// @ts-ignore
import { Client, basicNodeSigner } from "@stellar/stellar-sdk/contract";
import {
  SOROBAN_CONFIG,
  SOURCE_KEYPAIR_SECRET,
} from "../config/constants";
import base64url from "base64url";
// @ts-ignore
import { Api, Server } from "@stellar/stellar-sdk/rpc";
import { RpcServer } from "@stellar/stellar-sdk/lib/rpc/server";

export class SmartWalletService {
  private static instance: SmartWalletService;
  private passkeyService: PasskeyService;
  private readonly sourceKeypair: Keypair;
  private rpcClient: RpcServer;

  public static getInstance(): SmartWalletService {
    if (!SmartWalletService.instance) {
      SmartWalletService.instance = new SmartWalletService();
    }
    return SmartWalletService.instance;
  }

  constructor() {
    this.passkeyService = new PasskeyService();
    this.sourceKeypair = Keypair.fromSecret(SOURCE_KEYPAIR_SECRET);
    this.rpcClient = new Server(SOROBAN_CONFIG.RPC_URL);
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
    const sourceAcc = await this.rpcClient.getAccount(this.sourceKeypair.publicKey());
    const fromAcc = await this.generateFundedKeypair();

    // const op = await this.buildContractCallOp(contractId)
    const op = Operation.invokeContractFunction({
      contract: Asset.native().contractId(Networks.TESTNET),
      function: 'transfer',
      args: [
        nativeToScVal(fromAcc.publicKey(), { type: 'address' }), // from
        nativeToScVal(contractId, { type: 'address' }),  // to
        nativeToScVal(10000000, { type: 'i128' }) // amount
      ],
    })

    // 1. Build transaction
    console.log(1)
    const tx = new TransactionBuilder(
      sourceAcc,
      {
        networkPassphrase: Networks.TESTNET,
        fee: '10000',
      })
      .addOperation(op)
      .setTimeout(300)
      .build();

    // // 2. Simulate transaction
    // console.log(2)
    // const simulatedTx = await this.rpcClient.simulateTransaction(tx);
    // if(!Api.isSimulationSuccess(simulatedTx)) {
    //   throw new Error(`Transaction simulation failed: ${simulatedTx}`);
    // }
    //
    // // 3. Sign auth entries
    // console.log(3)
    // // @ts-ignore
    // const signedEntries = await Promise.all(simulatedTx.result.auth?.map(entry =>
    //     authorizeEntry(entry, fromAcc, simulatedTx.latestLedger + 600, SOROBAN_CONFIG.NETWORK_PASSPHRASE)
    //   ) ?? []
    // );
    //
    // // Step 4: Simulate again to get updated resources
    // console.log(4)
    // const rawOp = tx.operations[0] as Operation.InvokeHostFunction;
    // const preppedTx = TransactionBuilder.cloneFrom(tx)
    //   .clearOperations()
    //   .addOperation(
    //     Operation.invokeHostFunction({
    //       ...rawOp,
    //       auth: signedEntries,
    //     }),
    //   ).build()

    // const preppedTx = new TransactionBuilder(
    //   sourceAcc,
    //   {
    //     fee: '10000',
    //     networkPassphrase: SOROBAN_CONFIG.NETWORK_PASSPHRASE,
    //   })
    //   .addOperation(Operation.invokeHostFunction({
    //     ...rawOp,
    //     auth: signedEntries,
    //   }))
    //   .setTimeout(30)
    //   .build();

    const preppedTx = await this.rpcClient.prepareTransaction(tx)
    preppedTx.sign(this.sourceKeypair)

    // Step 5: Send the transaction
    // console.log(5)
    const sendResult = await this.rpcClient.sendTransaction(preppedTx);
    if (sendResult.status === 'ERROR') {
      const errorXDR = sendResult.errorResult; // This is likely an xdr.TransactionResult

      try {
        // @ts-ignore
        const result = xdr.TransactionResult.fromXDR(errorXDR.toXDR()); // or .resultXdr if raw XDR string
        console.log(result.result()); // Now you can see what the actual error is
      } catch (e) {
        console.error("Failed to parse error XDR:", e);
      }
    }
  }

  // private async buildContractCallOp(contractId: string) {
  //   const fromAcc = await this.generateFundedKeypair()
  //   const tokenContract = new Contract(Asset.native().contractId(Networks.TESTNET));
  //
  //   const scFrom = accountToScVal(fromAcc.publicKey());
  //   const scTo = accountToScVal(contractId);
  //   const scAmount = new XdrLargeInt("i128", 10000).toScVal();
  //
  //   return tokenContract.call("transfer",
  //     ...[ scFrom, scTo, scAmount ]);
  // }

  private async generateFundedKeypair() {
    const keypair = Keypair.random();
    await this.rpcClient.requestAirdrop(keypair.publicKey());
    return keypair;
  }
}