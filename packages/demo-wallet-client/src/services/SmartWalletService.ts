import { PasskeyService } from "./PasskeyService";
import { Keypair } from "@stellar/stellar-sdk";
// @ts-ignore
import { Client, basicNodeSigner } from "@stellar/stellar-sdk/contract";
// @ts-ignore
import { Server } from "@stellar/stellar-sdk/rpc";
import { SOROBAN_CONFIG } from "../config/constants";

export class SmartWalletService {
  private static instance: SmartWalletService;
  private passkeyService: PasskeyService;

  public static getInstance(): SmartWalletService {
    if (!SmartWalletService.instance) {
      SmartWalletService.instance = new SmartWalletService();
    }
    return SmartWalletService.instance;
  }

  constructor() {
    this.passkeyService = new PasskeyService();
  }

  public async createPasskeyContract(passkeyName: string) {
    // 1. Register passkey
    const { pkId, pk } = await this.passkeyService.registerPasskey(passkeyName);

    // 2. Generate source account
    const sourceKeypair = await this.generateFundedKeypair();

    // 3. Deploy contract
    const { signTransaction } = basicNodeSigner(sourceKeypair, SOROBAN_CONFIG.NETWORK_PASSPHRASE);

    const deployTx = await Client.deploy(
      {
        credential_id: pkId,
        public_key: pk,
      },
      {
        networkPassphrase: SOROBAN_CONFIG.NETWORK_PASSPHRASE,
        rpcUrl: SOROBAN_CONFIG.RPC_URL,
        wasmHash: SOROBAN_CONFIG.WASM_HASH,
        publicKey: sourceKeypair.publicKey(),
        signTransaction,
      }
    );

    const { result: client } = await deployTx.signAndSend();
    const contractId = client.options.contractId;

    console.log("Contract Deployment Info:", {
      contractId,
      sourceAccount: {
        publicKey: sourceKeypair.publicKey(),
        secret: sourceKeypair.secret(),
      },
    });

    return {
      contractId,
      pkId,
      sourceAccount: {
        publicKey: sourceKeypair.publicKey(),
        secretKey: sourceKeypair.secret(),
      },
    };
  }

  private async generateFundedKeypair() {
    const keypair = Keypair.random();
    const server = new Server(SOROBAN_CONFIG.RPC_URL);
    await server.requestAirdrop(keypair.publicKey());
    return keypair;
  }
}