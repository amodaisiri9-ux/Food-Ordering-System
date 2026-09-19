const Review = require('../models/Review');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');

// @desc    Add a review
// @route   POST /api/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { foodItem, order, rating, comment } = req.body;

    // Check if order exists and belongs to user
    const foundOrder = await Order.findById(order);
    if (!foundOrder || foundOrder.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
    }

    // Check if order is completed
    if (foundOrder.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'You can only review completed orders' });
    }

    const review = await Review.create({
      customer: req.user.id,
      foodItem,
      order,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('customer', 'name')
      .populate('foodItem', 'name')
      .sort('-createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};
