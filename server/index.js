const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const key = ec.genKeyPair();
const key2 = ec.genKeyPair();
const key3 = ec.genKeyPair();

console.log({
  privateKey: key.getPrivate().toString(16),
  publicX: key.getPublic().x.toString(16),
  publicY: key.getPublic().y.toString(16),
});

const address = key.getPublic().encode('hex');
const address2 = key2.getPublic().encode('hex');
const address3 = key3.getPublic().encode('hex');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {}
balances[address] = 100;
balances[address2] = 200;
balances[address3] = 300;

app.get('/balances', (req, res) => {
  res.send({ balances });
})

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const { sender, recipient, amount } = req.body;
  if (balances && !Object.keys(balances).includes(recipient)) {
    throw Error('that recipient does not exist!');
  } else {
    balances[sender] -= amount;
    balances[recipient] = (balances[recipient] || 0) + +amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
