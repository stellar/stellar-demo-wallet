import { Server } from "@stellar/stellar-sdk/rpc";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
// @ts-ignore
import findConfig from "find-config";
import * as fs from "node:fs";
import * as crypto from "node:crypto";

dotenv.config({ path: findConfig(".env") as string });

const SOURCE_KEYPAIR_SECRET = String(process.env.SOURCE_KEYPAIR_SECRET);
const RPC_TESTNET_URL = "https://soroban-testnet.stellar.org";

export class ContractManager {
  private rpcClient = new Server(RPC_TESTNET_URL);

  private readonly WASM_PATH = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../packages/demo-wallet-soroban/example-wasm/contract_account.wasm",
  );

  public async manageContractWasm() {
    // check if contract wasm hash available on network
    if (!(await this.isContractWasmOnNetwork(this.WASM_PATH))) {
      console.log("WASM not found on network. Uploading...");
      await this.uploadContract(this.WASM_PATH);
    } else {
      console.log("WASM already uploaded on network");
    }
  }

  private async isContractWasmOnNetwork(filePath: string): Promise<boolean> {
    try {
      console.log("Checking for WASM hash existence");
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(new Uint8Array(fileBuffer)).digest('hex');
      await this.rpcClient.getContractWasmByHash(hash, "hex");
      console.log("WASM found:", hash);
      return true;
    } catch (error) {
      console.log("WASM not found:", error);
      return false;
    }
  }

  private async uploadContract(wasmPath: string) {
    const cmd = `stellar contract upload \
    --wasm ${wasmPath} \
    --network testnet \
    --source-account ${SOURCE_KEYPAIR_SECRET}`;

    try {
      execSync(cmd, { stdio: "inherit" });
    } catch (error) {
      throw new Error(`Contract upload failed: ${error}`);
    }
  }
}
