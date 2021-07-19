import "./index.scss";

const EC = require("elliptic").ec;
const SHA256 = require("crypto-js/sha256");
const ec = new EC("secp256k1");

const server = "http://localhost:3042";

function sign(message, privateKey) {
  const key = ec.keyFromPrivate(privateKey);

  const msgHash = SHA256(message);

  const signature = key.sign(msgHash.toString());

  const body = {
    message,
    signature: {
      r: signature.r.toString(16),
      s: signature.s.toString(16),
    },
  };

  return body;
}

function verify(signedTransaction, publicKey) {
  const { message, signature } = signedTransaction;

  const key = ec.keyFromPublic(publicKey, "hex");

  const msgHash = SHA256(message).toString();

  return key.verify(msgHash, signature);
}

document
  .getElementById("exchange-address")
  .addEventListener("input", ({ target: { value } }) => {
    if (value === "") {
      document.getElementById("balance").innerHTML = 0;
      return;
    }

    fetch(`${server}/balance/${value}`)
      .then((response) => {
        return response.json();
      })
      .then(({ balance }) => {
        document.getElementById("balance").innerHTML = balance;
      });
  });

document.getElementById("get-total-balances").addEventListener("click", () => {
  const request = new Request(`${server}/balances`, { method: "GET" });

  fetch(request, { headers: { "Content-Type": "application/json" } })
    .then((response) => {
      return response.json();
    })
    .then(({ balances }) => {
      const keys = Object.keys(balances);
      let printable = "";

      for (let i = 0; i <= keys.length - 1; i++) {
        printable += `${keys[i]}: ${balances[keys[i]]} <br />`;
      }

      document.getElementById("total-balances").innerHTML = printable;
    });
});

document.getElementById("transfer-amount").addEventListener("click", () => {
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  const privateKey = document.getElementById("privateKey").value;

  const message = `{
    sender: ${sender},
    recipient: ${recipient},
    amount: ${amount}
  }`;

  const signedTransaction = sign(message, privateKey);

  if (verify(signedTransaction, sender)) {
    const body = JSON.stringify({
      sender,
      amount,
      recipient,
      privateKey,
    });

    const request = new Request(`${server}/send`, { method: "POST", body });

    fetch(request, { headers: { "Content-Type": "application/json" } })
      .then((response) => {
        return response.json();
      })
      .then(({ balance }) => {
        document.getElementById("balance").innerHTML = balance;
      })
      .catch((error) => {
        alert("that recipient does not exist!");
      });
  } else {
    alert("message cannot be signed due to incorrect private key!");
  }
});
