const express = require('express');
const { nearMePlaces, checkInPlace } = require('../controllers/mapsController');
const { authenticateToken } = require('../middlewares/auth');
const { uploadPhoto } = require('../middlewares/photoUpload');
const router = express.Router();

router.get('/maps/nearMePlaces', authenticateToken, nearMePlaces);
router.post('/maps/checkInPlace', [authenticateToken, uploadPhoto.single('photo')], checkInPlace);

module.exports = router;
