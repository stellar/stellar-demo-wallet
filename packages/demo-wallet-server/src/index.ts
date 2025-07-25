import express, { ErrorRequestHandler } from "express";
import {
  Transaction,
  Keypair,
  authorizeEntry,
  xdr,
} from "@stellar/stellar-sdk";
import bodyParser from "body-parser";

require("dotenv").config({ path: require("find-config")(".env") });

const PORT = process.env.SERVER_PORT ?? 7000;
const SERVER_SIGNING_KEY = String(process.env.SERVER_SIGNING_KEY);
const app = express();

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
app.use(
  "/.well-known",
  express.static("./src/static/well_known", {
    setHeaders: function (res, _) {
      res.set("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
      res.type("application/json");
      console.log("request to /.well-known");
    },
  }),
);

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

  transaction.sign(Keypair.fromSecret(SERVER_SIGNING_KEY));

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
  const valid_until_ledger_seq= req.body.valid_until_ledger_seq;
  const network_passphrase = req.body.network_passphrase;

  const signed_entry = await authorizeEntry(
    xdr.SorobanAuthorizationEntry.fromXDR(unsigned_entry, "base64"),
    Keypair.fromSecret(SERVER_SIGNING_KEY),
    Number(valid_until_ledger_seq),
    network_passphrase,
  );

  res.set("Access-Control-Allow-Origin", "*");
  res.status(200);
  res.send({
    signed_entry: signed_entry.toXDR('base64'),
  });
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isProduction =  process.env.NODE_ENV === "production"

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

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
