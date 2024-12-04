const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { incermentUserScore } = require('./userController');

async function checkIn(req, res, fileUrl) {
  try {
    var { place, content, used_badge } = req.body;
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

    if(used_badge && used_badge.name) {
      //used_badge = JSON.stringify(used_badge);
    } else {
      if(used_badge) {
        used_badge = JSON.parse(used_badge.toString());
      }
    }

    const hasPhoto = fileUrl.trim() === "" ? false : true;

    const db = getDB();
    var checkIn = {
      place: JSON.parse(place.toString()),
      tg_user_id: user.id,
      checkin_date: new Date(),
      content: content,
      hasPhoto: hasPhoto,
      photoURI: fileUrl
    }
    if(used_badge && (used_badge.name ?? "").includes("Welcome to Pinner")) {
        checkIn.used_badge = used_badge;
        incermentUserScore(user.id, hasPhoto ? 777 : 555);
    } else {
      incermentUserScore(user.id, hasPhoto ? 222: 111);
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
            user: { $arrayElemAt: ["$user", 0] },
            boosterCount: {
              $size: { $ifNull: ["$boosters", []] }
            },
            hasCheckinDate: {
              $cond: {
                if: {
                  $ifNull: ["$checkin_date", false]
                },
                then: 1,
                else: 0
              }
            }
          }
        },
        {
          $sort: {
            hasCheckinDate: -1,
            boosterCount: -1,
            checkin_date: -1
          }
        },
        {
          $project: {
            boosterCount: 0,
            hasCheckinDate: 0
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
              user: { $arrayElemAt: ["$user", 0] },
              boosterCount: {
                $size: { $ifNull: ["$boosters", []] }
              },
              hasCheckinDate: {
                $cond: {
                  if: {
                    $ifNull: ["$checkin_date", false]
                  },
                  then: 1,
                  else: 0
                }
              }
            }
          },
          {
            $sort: {
              hasCheckinDate: -1,
              boosterCount: -1,
              checkin_date: -1
            }
          },
          {
            $project: {
              boosterCount: 0,
              hasCheckinDate: 0
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
              user: { $arrayElemAt: ["$user", 0] },
              boosterCount: {
                $size: { $ifNull: ["$boosters", []] }
              },
              hasCheckinDate: {
                $cond: {
                  if: {
                    $ifNull: ["$checkin_date", false]
                  },
                  then: 1,
                  else: 0
                }
              }
            }
          },
          {
            $sort: {
              hasCheckinDate: -1,
              boosterCount: -1,
              checkin_date: -1
            }
          },
          {
            $project: {
              boosterCount: 0,
              hasCheckinDate: 0
            }
          }
        ]).toArray();
      }
    }

    for (let i = 0; i < ci.length; i++) {
      const e = ci[i];
      for (let j = 0; j < (e.comments ?? []).length; j++) {
        const a = e.comments[j];
        const user = await db.collection("users").findOne({ id: a.tg_user_id });
        ci[i].comments[j].user = user;
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
          user: { $arrayElemAt: ["$user", 0] },
          boosterCount: {
            $size: { $ifNull: ["$boosters", []] }
          },
          hasCheckinDate: {
            $cond: {
              if: {
                $ifNull: ["$checkin_date", false]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $sort: {
          hasCheckinDate: -1,
          boosterCount: -1,
          checkin_date: -1
        }
      },
      {
        $project: {
          boosterCount: 0,
          hasCheckinDate: 0
        }
      }
    ]).toArray();

    for (let i = 0; i < ci.length; i++) {
      const e = ci[i];
      for (let j = 0; j < (e.comments ?? []).length; j++) {
        const a = e.comments[j];
        const user = await db.collection("users").findOne({ id: a.tg_user_id });
        ci[i].comments[j].user = user;
      }
    }

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
          user: { $arrayElemAt: ["$user", 0] },
          boosterCount: {
            $size: { $ifNull: ["$boosters", []] }
          },
          hasCheckinDate: {
            $cond: {
              if: {
                $ifNull: ["$checkin_date", false]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $sort: {
          hasCheckinDate: -1,
          boosterCount: -1,
          checkin_date: -1
        }
      },
      {
        $project: {
          boosterCount: 0,
          hasCheckinDate: 0
        }
      }
    ]).toArray();

    for (let i = 0; i < ci.length; i++) {
      const e = ci[i];
      for (let j = 0; j < (e.comments ?? []).length; j++) {
        const a = e.comments[j];
        const user = await db.collection("users").findOne({ id: a.tg_user_id });
        ci[i].comments[j].user = user;
      }
    }

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
      await db.collection("notifications").deleteOne({
        post_id: ci._id.toString(),
        receiver: ci.tg_user_id,
        sender: thisUs.id,
        notification_type: "like",
      });
      status = 0;
    } else {
      likers.push(thisUs.id);
      thisUsLikedPosts.push(ci._id.toString());
      await db.collection("check-in").updateOne({ _id: new ObjectId(post_id.toString()) }, { $set: { likers: likers }});
      await db.collection("users").updateOne({ _id: thisUs._id }, { $set: { likedPosts: thisUsLikedPosts }});
      incermentUserScore(ci.tg_user_id, 44);
      await db.collection("notifications").insertOne({
        post_id: ci._id.toString(),
        receiver: ci.tg_user_id,
        sender: thisUs.id,
        notification_type: "like",
        notification_date: new Date(),
      });
      status = 1;
    }

    res.status(200).json({ status: status === 1 ? "liked" : "disliked" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const getFollowingsCheckIn = async(req, res) => {
  try {
    const db = getDB();
    var thisUs = await db.collection("users").findOne({ id: req.user.id });
    const ci = await db.collection("check-in").aggregate([
      {
        $match: {
          tg_user_id: {
            $in: thisUs.followings
          }
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
          user: { $arrayElemAt: ["$user", 0] },
          boosterCount: {
            $size: { $ifNull: ["$boosters", []] }
          },
          hasCheckinDate: {
            $cond: {
              if: {
                $ifNull: ["$checkin_date", false]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $sort: {
          hasCheckinDate: -1,
          boosterCount: -1,
          checkin_date: -1
        }
      },
      {
        $project: {
          boosterCount: 0,
          hasCheckinDate: 0
        }
      }
    ]).toArray();

    for (let i = 0; i < ci.length; i++) {
      const e = ci[i];
      for (let j = 0; j < (e.comments ?? []).length; j++) {
        const a = e.comments[j];
        const user = await db.collection("users").findOne({ id: a.tg_user_id });
        ci[i].comments[j].user = user;
      }
    }

    res.status(200).json(ci);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const commentCheckIn = async(req, res) => {
  try {
    var { post_id, content } = req.body;

    if (!post_id || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (post_id.toString().trim() === "" || content.toString().trim() === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = getDB();
    var ci = await db.collection("check-in").findOne({ _id: new ObjectId(post_id.toString()) });
    var comments = ci.comments ?? [];
    comments.push({
      content: content,
      tg_user_id: req.user.id,
      comment_date: new Date(),
    });
    await db.collection("check-in").updateOne({ _id: new ObjectId(post_id.toString()) }, { $set: { comments: comments }});
    await db.collection("notifications").insertOne({
      post_id: ci._id.toString(),
      receiver: ci.tg_user_id,
      sender: req.user.id,
      notification_type: "comment",
      notification_date: new Date(),
    });
    incermentUserScore(ci.tg_user_id, 88);

    res.status(200).json({ status: "commented" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const boostCheckIn = async(req, res) => {
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

    if (!(thisUs.ton_pinner_premium ?? false)) {
      return res.status(400).json({ message: "Only premium users can use boost" });
    }
     
    var thisUsBoostedPosts = thisUs.boostedPosts ?? [];
    var status = 0;
    var boosters = ci.boosters ?? [];
    if(boosters.includes(thisUs.id)) {
      boosters = boosters.filter(function(item) { return item !== thisUs.id });
      thisUsBoostedPosts = thisUsBoostedPosts.filter(function(item) { return item !== ci._id.toString() });
      await db.collection("check-in").updateOne({ _id: new ObjectId(post_id.toString()) }, { $set: { boosters: boosters }});
      await db.collection("users").updateOne({ _id: thisUs._id }, { $set: { boostedPosts: thisUsBoostedPosts }});
      await db.collection("notifications").deleteOne({
        post_id: ci._id.toString(),
        receiver: ci.tg_user_id,
        sender: thisUs.id,
        notification_type: "boost",
      });
      status = 0;
    } else {
      boosters.push(thisUs.id);
      thisUsBoostedPosts.push(ci._id.toString());
      await db.collection("check-in").updateOne({ _id: new ObjectId(post_id.toString()) }, { $set: { boosters: boosters }});
      await db.collection("users").updateOne({ _id: thisUs._id }, { $set: { boostedPosts: thisUsBoostedPosts }});
      incermentUserScore(ci.tg_user_id, 2222);
      await db.collection("notifications").insertOne({
        post_id: ci._id.toString(),
        receiver: ci.tg_user_id,
        sender: thisUs.id,
        notification_type: "boost",
        notification_date: new Date(),
      });
      status = 1;
    }

    res.status(200).json({ status: status === 1 ? "boosted" : "unboosted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

module.exports = { checkInPlace, checkInPlaceWithPhoto, getAllCheckIn, getMyCheckIn, likeCheckIn, getUserCheckIn, getFollowingsCheckIn, commentCheckIn, boostCheckIn };
