import { Api, Server } from "@stellar/stellar-sdk/rpc";
import express, { ErrorRequestHandler } from "express";
import {
  Address,
  Keypair,
  Transaction,
  authorizeEntry,
  xdr,
} from "@stellar/stellar-sdk";
import bodyParser from "body-parser";
import { ContractManager } from "./ContractManager.js";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
// @ts-ignore
import findConfig from "find-config";

dotenv.config({ path: findConfig(".env") as string });

const PORT = process.env.SERVER_PORT ?? 7000;
const SERVER_ACCOUNT = String(process.env.SERVER_ACCOUNT ?? process.env.SERVER_SIGNING_PUBLIC_KEY);
const SERVER_SIGNING_PUBLIC_KEY = String(process.env.SERVER_SIGNING_PUBLIC_KEY);
const SERVER_SIGNING_PRIVATE_KEY = String(process.env.SERVER_SIGNING_PRIVATE_KEY);
const SOURCE_KEYPAIR_SECRET = String(process.env.SOURCE_KEYPAIR_SECRET);
const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";
const app = express();
const rpcClient = new Server("https://soroban-testnet.stellar.org");

let stellarToml = "";

// JSON parsing with error handling
app.use(bodyParser.json({
  verify: (_req, _res, buf, encoding) => {
    try {
      JSON.parse(buf.toString(encoding as BufferEncoding));
    } catch (e) {
      // Specific handling for JSON parsing errors
      throw new SyntaxError("Invalid JSON payload");
    }
  }
}));

app.use(bodyParser.urlencoded({ extended: true }));

//TODO: add logging middleware
// Serve the sep-1 stellar.toml file
 app.get("/.well-known/stellar.toml", (_req, res) => {
    res.set("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Content-Type", "text/plain");
    res.send(stellarToml);
  });

// Sign requests from the demo wallet client for sep-10 client attribution
app.post("/sign", (req, res) => {
  console.log("request to /sign");
  const envelope_xdr = req.body.transaction;
  const network_passphrase = req.body.network_passphrase;
  const transaction = new Transaction(envelope_xdr, network_passphrase);

  if (Number.parseInt(transaction.sequence, 10) !== 0) {
    res.status(400);
    res.send("transaction sequence value must be '0'");
    return;
  }

  transaction.sign(Keypair.fromSecret(SERVER_SIGNING_PRIVATE_KEY));

  res.set("Access-Control-Allow-Origin", "*");
  res.status(200);
  res.send({
    transaction: transaction.toEnvelope().toXDR("base64"),
    network_passphrase: network_passphrase,
  });
});

app.post("/sep45/sign", async (req, res) => {
  console.log("request to /sep45/sign");
  const unsigned_entry = req.body.unsigned_entry;
  const valid_until_ledger_seq = req.body.valid_until_ledger_seq;
  const network_passphrase = req.body.network_passphrase;

  const signed_entry = await authorizeEntry(
    xdr.SorobanAuthorizationEntry.fromXDR(unsigned_entry, "base64"),
    Keypair.fromSecret(SERVER_SIGNING_PRIVATE_KEY),
    Number(valid_until_ledger_seq),
    network_passphrase,
  );

  res.set("Access-Control-Allow-Origin", "*");
  res.status(200);
  res.send({
    signed_entry: signed_entry.toXDR("base64"),
  });
});

app.post("/sign-tx", async (req, res) => {
  console.log("request to /sign-tx");
  const unsigned_tx = req.body.unsigned_tx;
  const network_passphrase = req.body.network_passphrase;

  try {
    const tx = new Transaction(unsigned_tx, network_passphrase);
    const sourceKeypair = Keypair.fromSecret(SOURCE_KEYPAIR_SECRET);

    // verify that the transaction is a Soroban transaction
    tx.operations.forEach((op) => {
      if (op.type != "invokeHostFunction") {
        console.log(op.type);
        throw new Error("Transaction operations is not a invokeHostFunction");
      }
    });

    // verify that the transaction does not operate on the source account
    const simulatedTx = await rpcClient.simulateTransaction(tx);
    if (Api.isSimulationSuccess(simulatedTx)) {
      simulatedTx.result?.auth?.forEach((entry) => {
        if (
          entry.credentials().switch() !=
          xdr.SorobanCredentialsType.sorobanCredentialsSourceAccount() &&
          Address.fromScAddress(
            entry.credentials().address().address(),
          ).toString() === sourceKeypair.publicKey()
        ) {
          throw new Error("Transaction cannot operate on the source account");
        }
      });
    }

    tx.sign(sourceKeypair);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(200);
    res.send({ signed_tx: tx.toXDR() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get source account public key for client-side operations
app.get("/source-public-key", (_req, res) => {
  console.log("request to /source-public-key");
  try {
    const sourceKeypair = Keypair.fromSecret(SOURCE_KEYPAIR_SECRET);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(200);
    res.send({
      public_key: sourceKeypair.publicKey(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isProduction = process.env.NODE_ENV === "production";

  const status = err.status || err.statusCode || 500;
  const name = err.name || (err instanceof Error ? err.constructor.name : 'Internal Server Error');
  const message = err.message || (typeof err === 'string' ? err : 'An unexpected error occurred');
  const stack = err instanceof Error ? err.stack : undefined;

  res.status(status).json({
    error: name,
    message: message,
    ...(!isProduction && { stack }),
  });
};

app.use(errorHandler);

async function startup() {
  try {
    // Only check testnet accounts during startup. For mainnet usage, users must
    // manually fund their own accounts as we cannot operate on their behalf.
    // Mainnet account validation failures will surface during SEP-45 signing operations.

    // 1. source account
    const sourceKeypair = Keypair.fromSecret(SOURCE_KEYPAIR_SECRET);
    const sourceUrl = `${HORIZON_TESTNET_URL}/accounts/${sourceKeypair.publicKey()}`;
    const sourceResponse = await fetch(sourceUrl);
    if (sourceResponse.status === 404) {
      await fetch(`${FRIENDBOT_URL}?addr=${sourceKeypair.publicKey()}`);
    }
    console.log("1. Source account ready");

    // 2. signing account
    const signingKeypair = Keypair.fromSecret(SERVER_SIGNING_PRIVATE_KEY);
    const signingUrl = `${HORIZON_TESTNET_URL}/accounts/${signingKeypair.publicKey()}`;
    const signingResponse = await fetch(signingUrl);
    if (signingResponse.status === 404) {
      await fetch(`${FRIENDBOT_URL}?addr=${signingKeypair.publicKey()}`);
    }
    console.log("2. Signing account ready");

    // 3. stellar.toml generation
    const templatePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "src/static/well-known/stellar.toml"
    );
    
    const stellarTomlTemplate = fs.readFileSync(templatePath, "utf-8");
    stellarToml = stellarTomlTemplate
      .replace("{{SERVER_ACCOUNT}}", SERVER_ACCOUNT)
      .replace("{{SERVER_SIGNING_PUBLIC_KEY}}", SERVER_SIGNING_PUBLIC_KEY);
    console.log("3. Stellar.toml ready");

    // 4. contract build and upload
    const cm = new ContractManager();
    await cm.manageContractWasm();
    console.log("4. Contract ready");
  } catch (error) {
    console.error("Contract Account startup error:", error);
  }
}

// Call before starting server
startup().then(() => {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});
