const { getDB } = require('../config/db');
const { parse } = require('@telegram-apps/init-data-node');
const { generateToken } = require("../middlewares/auth");
const { ObjectId } = require('mongodb');

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

const follow = async(req, res) => {
  try {
    var { tg_user_id } = req.body;

    if (!tg_user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (tg_user_id.toString().trim() === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = getDB();
    var us = await db.collection("users").findOne({ id: Number(tg_user_id) });
    var thisUs = await db.collection("users").findOne({ id: Number(req.user.id) });
    var thisUsFollwings = thisUs.followings ?? [];
    var followers = us.followers ?? [];
    var status = 0;
    if(followers.includes(thisUs.id)) {
      followers = followers.filter(function(item) { return item !== thisUs.id });
      thisUsFollwings = thisUsFollwings.filter(function(item) { return item !== us.id });
      await db.collection("users").updateOne({ id: Number(us.id) }, { $set: { followers: followers }});
      await db.collection("users").updateOne({ id: Number(thisUs.id) }, { $set: { followings: thisUsFollwings }});
      status = 0;
    } else {
      followers.push(thisUs.id);
      thisUsFollwings.push(us.id);
      await db.collection("users").updateOne({ id: Number(us.id) }, { $set: { followers: followers }});
      await db.collection("users").updateOne({ id: Number(thisUs.id) }, { $set: { followings: thisUsFollwings }});
      status = 1;
    }

    res.status(200).json({ status: status === 1 ? "followed" : "unfollowed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const getFollowers = async(req, res) => {
  try {
    var { tg_user_id } = req.query;

    if (!tg_user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (tg_user_id.toString().trim() === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = getDB();
    var us = await db.collection("users").findOne({ id: tg_user_id.toString() === "my" ? Number(req.user.id) : Number(tg_user_id) });

    const users = await db.collection("users").aggregate([
      {
        $match: {
          id: { $in: us.followers ?? [] }
        }
      }
    ]).toArray();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const getFollowings = async(req, res) => {
  try {
    var { tg_user_id } = req.query;

    if (!tg_user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (tg_user_id.toString().trim() === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = getDB();
    var us = await db.collection("users").findOne({ id: tg_user_id.toString() === "my" ? Number(req.user.id) : Number(tg_user_id) });

    const users = await db.collection("users").aggregate([
      {
        $match: {
          id: { $in: us.followings ?? [] }
        }
      }
    ]).toArray();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const getLikedPosts = async(req, res) => {
  try {
    var { tg_user_id } = req.query;

    if (!tg_user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (tg_user_id.toString().trim() === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = getDB();
    var us = await db.collection("users").findOne({ id: tg_user_id.toString() === "my" ? Number(req.user.id) : Number(tg_user_id) });
    var likedPosts = us.likedPosts ?? [];
    likedPosts = likedPosts.map((x) => new ObjectId(x.toString()));

    const posts = await db.collection("check-in").aggregate([
      {
        $match: {
          _id: { $in: likedPosts }
        }
      }
    ]).toArray();

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

module.exports = { getUsers, getUser, login, follow, getFollowers, getFollowings, getLikedPosts };
