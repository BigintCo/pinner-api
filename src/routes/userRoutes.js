const express = require('express');
const { getUser, getUsers, login, follow, getFollowers, getFollowings, getLikedPosts, searchUsers, getNotifications } = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/auth');
const router = express.Router();

router.post('/users/login', login);
router.get('/users/current', authenticateToken, getUser);
router.get('/users', authenticateToken, getUsers);
router.post('/users/follow', authenticateToken, follow);
router.get('/users/followings', authenticateToken, getFollowings);
router.get('/users/followers', authenticateToken, getFollowers);
router.get('/users/likedPosts', authenticateToken, getLikedPosts);
router.get('/users/search', authenticateToken, searchUsers);
router.get('/users/notifications', authenticateToken, getNotifications);

module.exports = router;
