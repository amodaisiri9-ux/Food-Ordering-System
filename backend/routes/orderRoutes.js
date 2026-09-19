const express = require('express');
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  confirmOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderByOrderNumber,
  getProfitReport,
  receiveOrder,
} = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(protect);

router.get('/reports/profit', authorize('admin'), getProfitReport);
router.post('/', placeOrder);
router.get('/myorders', getMyOrders);
router.get('/number/:orderNumber', getOrderByOrderNumber);
router.get('/:id', getOrderById);

// Admin / Cashier routes
router.get('/', authorize('admin', 'cashier'), getAllOrders);
router.put('/:id/confirm', authorize('admin', 'cashier'), confirmOrder);
router.put('/:id/status', authorize('admin', 'cashier'), updateOrderStatus);

// Customer routes
router.put('/:id/receive', receiveOrder);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
