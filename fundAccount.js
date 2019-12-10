var StellarSdk = require('stellar-sdk');
var axios = require('axios');
var readline = require('readline-sync');

(async () => {
  var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

  var parentKeypair = StellarSdk.Keypair.random();
  var childPublicKey = readline.question('Enter your publicKey → ');

  await axios
  .get(`https://friendbot.stellar.org?addr=${parentKeypair.publicKey()}`)
  .then(() => console.log('✅ Parent account funded'))
  .catch(({response: {data}}) => console.error('❌', data));

  const transaction = new StellarSdk.TransactionBuilder(
    await server.loadAccount(parentKeypair.publicKey()),
    {
      fee: '10000',
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
  .addOperation(
    StellarSdk.Operation.createAccount({
      destination: childPublicKey,
      startingBalance: '9900'
    })
  )
  .setTimeout(0)
  .build();

  transaction.sign(parentKeypair);

  await server.submitTransaction(transaction)
  .then(() => console.log('✅ Child account created'))
  .catch(({response: {data}}) => console.error('❌', data));
})();