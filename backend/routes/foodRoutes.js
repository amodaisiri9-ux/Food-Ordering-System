const express = require('express');
const {
  getAllFoodItems,
  getPopularItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  addRating,
} = require('../controllers/foodController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllFoodItems);
router.get('/popular', getPopularItems);
router.get('/:id', getFoodItemById);

// Protected routes (Admin Only)
router.post('/', protect, authorize('admin'), createFoodItem);
router.put('/:id', protect, authorize('admin'), updateFoodItem);
router.delete('/:id', protect, authorize('admin'), deleteFoodItem);

// Protected route (Customer)
router.post('/:id/rating', protect, addRating);

module.exports = router;
