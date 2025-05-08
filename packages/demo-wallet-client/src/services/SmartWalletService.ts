import { PasskeyService } from "./PasskeyService";
import { Address, hash, Keypair, StrKey, xdr } from "@stellar/stellar-sdk";
// @ts-ignore
import { Client, basicNodeSigner } from "@stellar/stellar-sdk/contract";
import { SOROBAN_CONFIG, SOURCE_KEYPAIR_SECRET } from "../config/constants";
import base64url from "base64url";

export class SmartWalletService {
  private static instance: SmartWalletService;
  private passkeyService: PasskeyService;
  private readonly sourceKeypair: Keypair;

  public static getInstance(): SmartWalletService {
    if (!SmartWalletService.instance) {
      SmartWalletService.instance = new SmartWalletService();
    }
    return SmartWalletService.instance;
  }

  constructor() {
    this.passkeyService = new PasskeyService();
    this.sourceKeypair = Keypair.fromSecret(SOURCE_KEYPAIR_SECRET);
  }

  public async createPasskeyContract(passkeyName: string) {
    // 1. Register passkey
    const { pkId, pk } = await this.passkeyService.registerPasskey(passkeyName);

    // 2. Deploy contract
    const { signTransaction } = basicNodeSigner(this.sourceKeypair, SOROBAN_CONFIG.NETWORK_PASSPHRASE);
    const deployTx = await Client.deploy(
      {
        credential_id: pkId,
        public_key: pk,
      },
      {
        networkPassphrase: SOROBAN_CONFIG.NETWORK_PASSPHRASE,
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
        networkId: hash(Buffer.from(SOROBAN_CONFIG.NETWORK_PASSPHRASE,)),
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

  // private async generateFundedKeypair() {
  //   const keypair = Keypair.random();
  //   const server = new Server(SOROBAN_CONFIG.RPC_URL);
  //   await server.requestAirdrop(keypair.publicKey());
  //   return keypair;
  // }
}