const Order = require('../models/Order');

// @desc    Get order details formatted as an invoice
// @route   GET /api/invoice/:orderId
// @access  Private (Customer/Cashier/Admin)
exports.getInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('customer', 'name email phone')
      .populate('items.foodItem', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership or if user is staff
    if (
      order.customer._id.toString() !== req.user.id &&
      req.user.role === 'customer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this invoice',
      });
    }

    // Structure the data explicitly for an invoice
    const invoiceData = {
      orderNumber: order.orderNumber,
      customer: order.customer,
      items: order.items.map((item) => ({
        name: item.foodItem ? item.foodItem.name : 'Unknown Item',
        unitPrice: item.price,
        quantity: item.quantity,
        totalItemPrice: item.price * item.quantity,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod || 'Not Selected',
      paymentStatus: order.paymentStatus,
      status: order.status,
      date: order.createdAt,
    };

    res.status(200).json({
      success: true,
      data: invoiceData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update payment method
// @route   PUT /api/invoice/:orderId/payment-method
// @access  Private (Customer)
exports.updatePaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a payment method',
      });
    }

    let order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (
      order.customer.toString() !== req.user.id &&
      req.user.role === 'customer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order',
      });
    }

    order.paymentMethod = paymentMethod;
    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark invoice as paid
// @route   PUT /api/invoice/:orderId/pay
// @access  Private (Admin/Cashier)
exports.markAsPaid = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.paymentStatus = 'Paid';
    await order.save();

    res.status(200).json({
      success: true,
      data: order,
      message: 'Payment status updated to Paid',
    });
  } catch (err) {
    next(err);
  }
};
