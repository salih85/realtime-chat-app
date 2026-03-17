const express = require('express');
const router = express.Router();
const { getUsers, getMessages } = require('../controllers/chatController');
const { protect } = require('../middlewears/authMiddleware');

router.get('/users', protect, getUsers);
router.get('/messages/:userId', protect, getMessages);

module.exports = router;
