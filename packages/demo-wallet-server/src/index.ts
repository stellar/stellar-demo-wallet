import express from "express";
import { checkTomlForFields } from "demo-wallet-shared/build/methods/checkTomlForFields";

const PORT: number = 7000;
const app = express();

app.use(express.json());

app.use(
  "/.well-known",
  express.static("src/static/well_known", {
    setHeaders: (res, _) => {
      res.set("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
      res.type("application/json");
    },
  }),
);

app.post("/sign", (_, res) => {
  const assetIssuer = "";
  const homeDomain = "testanchor.stellar.org";
  const networkURL = "";

  const webAuthTomlResponse = checkTomlForFields({
    sepName: "SEP-6 withdrawal",
    assetIssuer,
    requiredKeys: [],
    networkUrl: networkURL, // networkConfig.url,
    homeDomain,
  });

  // const envelope = challengeTransaction.toEnvelope().toXDR("base64");
  res.status(200);
  res.send({ webAuthTomlResponse });
  res.end();
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
