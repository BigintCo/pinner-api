const { getDB } = require('../config/db');

async function checkIn(req, res, fileUrl) {
  try {
    var { place, content } = req.body;
    var user = req.user;

    if (!place || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (place.toString().trim() === "" || content.toString().trim() === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if(place.place_id) {
      place = JSON.stringify(place);
    }

    const db = getDB();
    var checkIn = {
      place: JSON.parse(place.toString()),
      tg_user_id: user.id,
      content: content,
      hasPhoto: fileUrl.trim() === "" ? false : true,
      photoURI: fileUrl
    }
    await db.collection("check-in").insertOne(checkIn);

    return res.status(200).json(checkIn);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const checkInPlace = async (req, res) => {
  try {
    const fileUrl = "";
    await checkIn(req, res, fileUrl);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const checkInPlaceWithPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'Photo upload failed' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    await checkIn(req, res, fileUrl);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const getAllCheckIn = async(req, res) => {
  try {
    const db = getDB();
    const ci = await db.collection("check-in").find().toArray();
    res.status(200).json(ci);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const getMyCheckIn = async(req, res) => {
  try {
    const db = getDB();
    const ci = await db.collection("check-in").find({tg_user_id: req.user.id}).toArray();
    res.status(200).json(ci);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const likeCheckIn = async(req, res) => {
  try {
    const db = getDB();
    //......
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

module.exports = { checkInPlace, checkInPlaceWithPhoto, getAllCheckIn, getMyCheckIn, likeCheckIn };