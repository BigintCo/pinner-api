const { getDB } = require('../config/db');
const { parse, validate } = require('@telegram-apps/init-data-node');
const { generateToken } = require("../middlewares/auth")
const axios = require('axios');
const cache = require('memory-cache');

function mergeListsInterleaved(...lists) {
  const maxLength = Math.max(...lists.map(list => list.length));
  const mergedList = [];

  for (let i = 0; i < maxLength; i++) {
      for (let list of lists) {
          if (i < list.length) {
              mergedList.push(list[i]);
          }
      }
  }

  return mergedList;
}

async function getPlacesNearby(latitude, longitude, keyword) {
    const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;

    try {
        var response;
        if (keyword.trim() === "") {
          var response1 = (await axios.get(endpoint, {
            params: {
                location: `${latitude},${longitude}`,
                type: "cafe",
                rankby: 'distance',
                key: process.env.MAPS_SECRET_KEY,
            },
          })).data.results;
          var response2 = (await axios.get(endpoint, {
            params: {
                location: `${latitude},${longitude}`,
                type: "bar",
                rankby: 'distance',
                key: process.env.MAPS_SECRET_KEY,
            },
          })).data.results;
          var response3 = (await axios.get(endpoint, {
            params: {
                location: `${latitude},${longitude}`,
                type: "night_club",
                rankby: 'distance',
                key: process.env.MAPS_SECRET_KEY,
            },
          })).data.results;
          var response4 = (await axios.get(endpoint, {
            params: {
                location: `${latitude},${longitude}`,
                type: "restaurant",
                rankby: 'distance',
                key: process.env.MAPS_SECRET_KEY,
            },
          })).data.results;

          response = mergeListsInterleaved(response1, response2, response3, response4)
        } else {
          response = (await axios.get(endpoint, {
            params: {
                location: `${latitude},${longitude}`,
                keyword: keyword,
                rankby: 'distance',
                key: process.env.MAPS_SECRET_KEY,
            },
          })).data.results;
        }
        
        return response;
    } catch (error) {
        console.error("Fetching Error", error);
        return [];
    }
}

const nearMePlaces = async (req, res) => {
  try {
    const { latitude, longitude, keyword } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cachedData = cache.get('nearMePlaces/' + JSON.stringify(req.query));
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    var resVal = await getPlacesNearby(latitude, longitude, keyword);

    cache.put('nearMePlaces/' + JSON.stringify(req.query), resVal, 10 * 60 * 1000);

    res.status(200).json(resVal);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

module.exports = { nearMePlaces };