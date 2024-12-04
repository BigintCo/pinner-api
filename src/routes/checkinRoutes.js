const express = require('express');
const { checkInPlace, checkInPlaceWithPhoto, getAllCheckIn, getMyCheckIn, likeCheckIn, getUserCheckIn, getFollowingsCheckIn, commentCheckIn, boostCheckIn } = require('../controllers/checkinController');
const { authenticateToken } = require('../middlewares/auth');
const { uploadPhoto } = require('../middlewares/photoUpload');
const router = express.Router();

router.post('/checkin/withPhoto', [authenticateToken, uploadPhoto.single('photo')], checkInPlaceWithPhoto);
router.post('/checkin/withOutPhoto', authenticateToken, checkInPlace);
router.get('/checkin', authenticateToken, getAllCheckIn);
router.get('/checkin/my', authenticateToken, getMyCheckIn);
router.get('/checkin/user', authenticateToken, getUserCheckIn);
router.get('/checkin/followings', authenticateToken, getFollowingsCheckIn);
router.post('/checkin/like', authenticateToken, likeCheckIn);
router.post('/checkin/boost', authenticateToken, boostCheckIn);
router.post('/checkin/comment', authenticateToken, commentCheckIn);

module.exports = router;
