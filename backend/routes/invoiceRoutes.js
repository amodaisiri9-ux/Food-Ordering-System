const express = require('express');
const {
  getInvoice,
  updatePaymentMethod,
  markAsPaid,
} = require('../controllers/invoiceController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All invoice routes require authentication
router.use(protect);

router.get('/:orderId', getInvoice);
router.put('/:orderId/payment-method', updatePaymentMethod);

// Only staff can mark an invoice as paid directly
router.put('/:orderId/pay', authorize('admin', 'cashier'), markAsPaid);

module.exports = router;
