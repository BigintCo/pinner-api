const express = require('express');
const { nearMePlaces } = require('../controllers/mapsController');
const { authenticateToken } = require('../middlewares/auth');
const { uploadPhoto } = require('../middlewares/photoUpload');
const router = express.Router();

router.get('/maps/nearMePlaces', authenticateToken, nearMePlaces);

module.exports = router;
