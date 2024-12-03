require('dotenv').config();
const { connectDB, getDB } = require('./config/db');
const app = require('./app');
const axios = require("axios");

var premium_users = [];

const fetchTransactions = async () => {
  const epoch = Math.floor(new Date().getTime() / 1000.0);
  const receiverAddress = "UQA1DRT3O4ILDDHKsVGaDE3IT7w9TXapo44Ix-6IKH2YooOw";
  const endpoint = `https://toncenter.com/api/v3/transactions?account=${receiverAddress}&limit=100&offset=0&sort=desc&start_utime=${(epoch - (86400 * 31))}`;
  const thresholdValue = 990000000;

  try {
      const response = await axios.get(endpoint);

      if (response.data) {
          const filteredTransactions = response.data.transactions.filter(
              (tx) => tx.in_msg && tx.in_msg.value > thresholdValue
          );

          const senderAddresses = filteredTransactions.map(
              (tx) => { return { source: tx.in_msg.source, epoch: tx.now } }
          );

          const uniqueSenders = [...new Set(senderAddresses)];

          /*const userFriendlyAddresses = uniqueSenders.map((address) =>
            [ address, response.data.address_book[address.toString()].user_friendly ?? "" ]
          );*/

          return uniqueSenders;
      } else {
          console.error("No transaction data found");
          return [];
      }
  } catch (error) {
      console.error("Error fetching transactions:", error.message);
      return [];
  }
};

const setPremiumUsers = async (aList) => {
  try {
    var addressList = [];

    for (let i = 0; i < aList.map((x) => x.source).length; i++) {
      const e = aList[i];
      if (!premium_users.includes(e.source)) {
        addressList.push(e);
      }
    }
    
    if (addressList.length == 0) {
      return;
    }

    const db = getDB();
    const users = await db.collection("users").aggregate([
      {
        $match: {
          walletAddress: {
            $in: addressList.map((x) => x.source)
          }
        }
      }
    ]).toArray();

    for (let i = 0; i < users.length; i++) {
      const e = users[i];
      if (addressList.map((x)=> x.source).includes(e.walletAddress)) {
        var epoch = addressList.filter((x) => x.source === e.walletAddress)[0].epoch;
        await db.collection("users").updateOne({ id: Number(e.id) }, { $set: { ton_pinner_premium: true, ton_pinner_premium_last_pay_date: new Date(epoch * 1000) }});
        premium_users.push(e.walletAddress);
      }
    }
  } catch (error) {
    console.error("Server error:", error);
  }
}

const setFalsePremiumUsers = async () => {
  try {
    const db = getDB();
    const users = await db.collection("users").aggregate([
      {
        $match: {
          ton_pinner_premium: true
        }
      }
    ]).toArray();

    for (let i = 0; i < users.length; i++) {
      const e = users[i];
      if (e.ton_pinner_premium_last_pay_date < ((new Date()).setDate((new Date()).getDate() - 31))) {
        await db.collection("users").updateOne({ id: Number(e.id) }, { $set: { ton_pinner_premium: false }});
      }
    }
  } catch (error) {
    console.error("Server error:", error);
  }
}

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(error => {
  console.error("Failed to connect to database:", error);
});

setInterval(async () => {
  console.log("Fetching transactions...");
  var addressList = await fetchTransactions();
  setPremiumUsers(addressList);
}, 30 * 1000);

setInterval(async () => {
  console.log("Fetching users...");
  setFalsePremiumUsers();
}, 150 * 1000);