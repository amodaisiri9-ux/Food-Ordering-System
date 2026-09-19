const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
  },
  orderType: {
    type: DataTypes.ENUM('Takeaway', 'Dining'),
    allowNull: false,
  },
  tableNumber: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'),
    defaultValue: 'Pending',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'Card', 'Visa'),
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Paid'),
    defaultValue: 'Pending',
  },
  preparationTime: {
    type: DataTypes.INTEGER, // in minutes
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  hooks: {
    beforeCreate: async (order) => {
      const currentYear = new Date().getFullYear();
      const lastOrder = await Order.findOne({
        where: {
          orderNumber: {
            [require('sequelize').Op.like]: `FH-${currentYear}-%`
          }
        },
        order: [['createdAt', 'DESC']]
      });

      let sequence = 1;
      if (lastOrder && lastOrder.orderNumber) {
        const parts = lastOrder.orderNumber.split('-');
        if (parts.length === 3) {
          sequence = parseInt(parts[2], 10) + 1;
        }
      }

      order.orderNumber = `FH-${currentYear}-${sequence.toString().padStart(4, '0')}`;
    }
  }
});

module.exports = Order;
