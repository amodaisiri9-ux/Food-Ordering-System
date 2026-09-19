const { sequelize } = require('../config/db');
const User = require('./User');
const FoodItem = require('./FoodItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const Message = require('./Message');

// Associations
User.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });

User.hasMany(Review, { foreignKey: 'customerId' });
Review.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });

FoodItem.hasMany(Review, { foreignKey: 'foodItemId' });
Review.belongsTo(FoodItem, { as: 'foodItem', foreignKey: 'foodItemId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

FoodItem.hasMany(OrderItem, { foreignKey: 'foodItemId' });
OrderItem.belongsTo(FoodItem, { as: 'foodItem', foreignKey: 'foodItemId' });

Order.hasOne(Review, { foreignKey: 'orderId' });
Review.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });

module.exports = {
  sequelize,
  User,
  FoodItem,
  Order,
  OrderItem,
  Review,
  Message,
};
