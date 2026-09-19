const express = require('express');
const { chat, getWelcome } = require('../controllers/chatController');

const router = express.Router();

router.get('/welcome', getWelcome);
router.post('/', chat);

module.exports = router;
