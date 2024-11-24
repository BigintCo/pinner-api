const { getDB } = require('../config/db');
const { parse, validate } = require('@telegram-apps/init-data-node');
const { generateToken } = require("../middlewares/auth")

const login = async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ message: "InitData field required" });
    }

    let parsedInitData = parse(initData);

    try {
      validate(initData, process.env.TG_SECRET_TOKEN);
    } catch (e) {
      return res.status(401).json({ error: 'Token missing' });
    }

    const db = getDB();
    var tUser = { };
    const existingUser = await db.collection("users").findOne({ id: parsedInitData.user.id });
    if (existingUser) {
      tUser = existingUser;
    } else {
      var user = parsedInitData.user;
      user.pinnerFirstLogin = new Date();
      delete parsedInitData["user"];
      user.initData = parsedInitData;
      await db.collection("users").insertOne(user);
      tUser = user;
    }

    res.status(201).json({ token: generateToken(tUser) });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

const getUsers = async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection("users").find().toArray();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

const getUser = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

module.exports = { getUsers, getUser, login };
