const express = require('express');
const { addReview, getReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getReviews);
router.post('/', protect, addReview);

module.exports = router;
