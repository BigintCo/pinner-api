const express = require('express');
const { getUser, getUsers, login } = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/auth');
const router = express.Router();

router.post('/users/login', login);
router.get('/users/current', authenticateToken, getUser);
router.get('/users', getUsers);

module.exports = router;
