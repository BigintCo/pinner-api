const { ObjectId } = require('mongodb');
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
      checkin_date: new Date(),
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
    const isOnlyPhoto = req.query.isOnlyPhoto ?? false;
    const isOnlyText = req.query.isOnlyText ?? false;

    const db = getDB();
    var ci;

    if (isOnlyPhoto) {
      ci = await db.collection("check-in").aggregate([
        {
          $match: {
            hasPhoto: true
          }
        },
        {
          $lookup: {
            from: "users",
            let: {
              tg_id: "$tg_user_id"
            },
            as: "user",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$tg_id", "$id"]
                  }
                }
              }
            ]
          }
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$user", 0] }
          }
        }
      ]).toArray();
    } else {
      if (isOnlyText) { 
        ci = await db.collection("check-in").aggregate([
          {
            $match: {
              hasPhoto: false
            }
          },
          {
            $lookup: {
              from: "users",
              let: {
                tg_id: "$tg_user_id"
              },
              as: "user",
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$$tg_id", "$id"]
                    }
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              user: { $arrayElemAt: ["$user", 0] }
            }
          }
        ]).toArray();
      } else {
        ci = await db.collection("check-in").aggregate([
          {
            $lookup: {
              from: "users",
              let: {
                tg_id: "$tg_user_id"
              },
              as: "user",
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$$tg_id", "$id"]
                    }
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              user: { $arrayElemAt: ["$user", 0] }
            }
          }
        ]).toArray();
      }
    }

    res.status(200).json(ci);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const getMyCheckIn = async(req, res) => {
  try {
    const db = getDB();
    const ci = await db.collection("check-in").aggregate([
      {
        $match: {
          tg_user_id: req.user.id
        }
      },
      {
        $lookup: {
          from: "users",
          let: {
            tg_id: "$tg_user_id"
          },
          as: "user",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$tg_id", "$id"]
                }
              }
            }
          ]
        }
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] }
        }
      }
    ]).toArray();
    res.status(200).json(ci);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const getUserCheckIn = async(req, res) => {
  try {
    var { tg_user_id } = req.query;

    if (!tg_user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (tg_user_id.toString().trim() === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = getDB();
    const ci = await db.collection("check-in").aggregate([
      {
        $match: {
          tg_user_id: Number(tg_user_id)
        }
      },
      {
        $lookup: {
          from: "users",
          let: {
            tg_id: "$tg_user_id"
          },
          as: "user",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$tg_id", "$id"]
                }
              }
            }
          ]
        }
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] }
        }
      }
    ]).toArray();
    res.status(200).json(ci);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const likeCheckIn = async(req, res) => {
  try {
    var { post_id } = req.body;

    if (!post_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (post_id.toString().trim() === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = getDB();
    var ci = await db.collection("check-in").findOne({ _id: new ObjectId(post_id.toString()) });
    var thisUs = await db.collection("users").findOne({ id: req.user.id });
    var thisUsLikedPosts = thisUs.likedPosts ?? [];
    var status = 0;
    var likers = ci.likers ?? [];
    if(likers.includes(thisUs.id)) {
      likers = likers.filter(function(item) { return item !== thisUs.id });
      thisUsLikedPosts = thisUsLikedPosts.filter(function(item) { return item !== ci._id.toString() });
      await db.collection("check-in").updateOne({ _id: new ObjectId(post_id.toString()) }, { $set: { likers: likers }});
      await db.collection("users").updateOne({ _id: thisUs._id }, { $set: { likedPosts: thisUsLikedPosts }});
      status = 0;
    } else {
      likers.push(thisUs.id);
      thisUsLikedPosts.push(ci._id.toString());
      await db.collection("check-in").updateOne({ _id: new ObjectId(post_id.toString()) }, { $set: { likers: likers }});
      await db.collection("users").updateOne({ _id: thisUs._id }, { $set: { likedPosts: thisUsLikedPosts }});
      status = 1;
    }

    res.status(200).json({ status: status === 1 ? "liked" : "disliked" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

module.exports = { checkInPlace, checkInPlaceWithPhoto, getAllCheckIn, getMyCheckIn, likeCheckIn, getUserCheckIn };