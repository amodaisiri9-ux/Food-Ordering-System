const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FoodItem = sequelize.define('FoodItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  category: {
    type: DataTypes.ENUM('Starters', 'Main Course', 'Desserts', 'Beverages', 'Specials'),
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    defaultValue: '/uploads/default-food.png',
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isPopular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  preparationTime: {
    type: DataTypes.INTEGER, // in minutes
  },
  averageRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
});

module.exports = FoodItem;
