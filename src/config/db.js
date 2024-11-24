const { MongoClient } = require('mongodb');

let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    db = client.db(process.env.DB_NAME || "testDB");
    console.log("MongoDB Connected!");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const getDB = () => db;

module.exports = { connectDB, getDB };
