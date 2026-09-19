const { Order, OrderItem, FoodItem, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
exports.placeOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { items, orderType, tableNumber, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided',
      });
    }

    // Calculate totals
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.10;
    const totalAmount = subtotal + tax;

    const paymentStatus = paymentMethod === 'Cash' ? 'Pending' : 'Paid';

    // Create order
    const order = await Order.create({
      customerId: req.user.id,
      orderType,
      tableNumber,
      paymentMethod,
      paymentStatus,
      notes,
      subtotal,
      tax,
      totalAmount
    }, { transaction: t });

    // Create order items
    const orderItemsData = items.map(item => ({
      orderId: order.id,
      foodItemId: item.foodItem,
      quantity: item.quantity,
      price: item.price
    }));

    await OrderItem.bulkCreate(orderItemsData, { transaction: t });

    await t.commit();

    // Fetch the complete order with items to emit and return
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: FoodItem, as: 'foodItem' }] }
      ]
    });
    
    // Emit newOrder event to all connected staff
    req.io.emit('newOrder', fullOrder);

    res.status(201).json({
      success: true,
      data: fullOrder,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { customerId: req.user.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: FoodItem, as: 'foodItem' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'customer', attributes: ['name', 'email', 'phone'] },
        { model: OrderItem, as: 'items', include: [{ model: FoodItem, as: 'foodItem' }] }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Make sure user owns the order or is an admin/cashier
    if (
      order.customerId !== req.user.id &&
      req.user.role === 'customer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin/Cashier)
exports.getAllOrders = async (req, res, next) => {
  try {
    const where = {};
    
    if (req.query.status) {
      where.status = req.query.status;
    }

    const orders = await Order.findAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['name', 'email', 'phone'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: FoodItem, as: 'foodItem', attributes: ['name'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm order and set preparation time
// @route   PUT /api/orders/:id/confirm
// @access  Private (Admin/Cashier)
exports.confirmOrder = async (req, res, next) => {
  try {
    const { preparationTime } = req.body;

    if (!preparationTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide preparation time in minutes',
      });
    }

    let order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only Pending orders can be confirmed',
      });
    }

    order.status = 'Confirmed';
    order.preparationTime = preparationTime;

    await order.save();

    // Emit socket event
    req.io.to(order.orderNumber).emit('preparationTimeUpdate', {
      orderNumber: order.orderNumber,
      preparationTime: order.preparationTime,
    });
    req.io.to(order.orderNumber).emit('orderStatusUpdate', order);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin/Cashier)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status',
      });
    }

    let order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = status;
    await order.save();

    // Emit socket event
    req.io.to(order.orderNumber).emit('orderStatusUpdate', order);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customer)
exports.cancelOrder = async (req, res, next) => {
  try {
    let order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Make sure user owns the order
    if (
      order.customerId !== req.user.id &&
      req.user.role === 'customer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
      });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled because it is no longer pending',
      });
    }

    order.status = 'Cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order successfully cancelled',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order by orderNumber
// @route   GET /api/orders/number/:orderNumber
// @access  Private
exports.getOrderByOrderNumber = async (req, res, next) => {
  try {
    const order = await Order.findOne({ 
      where: { orderNumber: req.params.orderNumber },
      include: [
        { model: User, as: 'customer', attributes: ['name', 'email', 'phone'] },
        { model: OrderItem, as: 'items', include: [{ model: FoodItem, as: 'foodItem' }] }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Make sure user owns the order or is an admin/cashier
    if (
      order.customerId !== req.user.id &&
      req.user.role === 'customer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Customer marks dine-in order as received
// @route   PUT /api/orders/:id/receive
// @access  Private (Customer)
exports.receiveOrder = async (req, res, next) => {
  try {
    let order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order',
      });
    }

    if (order.status !== 'Ready') {
      return res.status(400).json({
        success: false,
        message: 'Order is not ready to be received yet',
      });
    }

    order.status = 'Completed';
    await order.save();

    if (req.io) {
      req.io.to(order.orderNumber).emit('orderStatusUpdate', order);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get daily profit report
// @route   GET /api/orders/reports/profit
// @access  Private (Admin)
exports.getProfitReport = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: {
        status: {
          [Op.ne]: 'Cancelled',
        },
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: FoodItem,
              as: 'foodItem',
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    const dailyDataMap = {};

    orders.forEach((order) => {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0];

      if (!dailyDataMap[dateStr]) {
        dailyDataMap[dateStr] = {
          date: dateStr,
          revenue: 0,
          cost: 0,
          profit: 0,
          orderCount: 0,
        };
      }

      const orderRevenue = parseFloat(order.subtotal || order.totalAmount || 0);
      dailyDataMap[dateStr].revenue += orderRevenue;
      dailyDataMap[dateStr].orderCount += 1;

      let orderCost = 0;
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const qty = item.quantity;
          const price = parseFloat(item.price);
          const itemCost = item.foodItem && item.foodItem.cost !== undefined && item.foodItem.cost !== null
            ? parseFloat(item.foodItem.cost)
            : price * 0.5;
          orderCost += itemCost * qty;
        });
      } else {
        orderCost = orderRevenue * 0.5;
      }

      dailyDataMap[dateStr].cost += orderCost;
    });

    const report = Object.values(dailyDataMap).map((day) => {
      const revenue = Math.round(day.revenue * 100) / 100;
      const cost = Math.round(day.cost * 100) / 100;
      const profit = Math.round((revenue - cost) * 100) / 100;

      return {
        date: day.date,
        revenue,
        cost,
        profit,
        orderCount: day.orderCount,
      };
    });

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
};
