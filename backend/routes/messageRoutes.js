const express = require('express');
const { addMessage, getMessages } = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin'), getMessages);
router.post('/', addMessage);

module.exports = router;
