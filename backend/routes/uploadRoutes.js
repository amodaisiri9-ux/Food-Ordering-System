const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadImage } = require('../controllers/uploadController');

// @route   POST /api/upload
// @desc    Upload an image
// @access  Public (or Protected if you add auth middleware)
router.post('/', upload.single('image'), uploadImage);

module.exports = router;
