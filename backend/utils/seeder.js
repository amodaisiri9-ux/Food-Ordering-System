const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { FoodItem, User } = require('../models');
const { connectDB } = require('../config/db');
const { syncDatabase } = require('./syncDatabase');

// Load env vars
dotenv.config();

// Connect to DB
const connectDBForSeeder = async () => {
  try {
    await connectDB();
    await syncDatabase();
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Sample Food Items
const foodItems = [
  // Starters
  { name: 'Spring Rolls', description: 'Crispy rolls filled with vegetables', price: 5.99, cost: 2.20, category: 'Starters', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=400&fit=crop', isAvailable: true, isPopular: true },
  { name: 'Soup of the Day', description: 'Freshly made seasonal soup', price: 4.50, cost: 1.50, category: 'Starters', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&h=400&fit=crop', isAvailable: true },
  { name: 'Bruschetta', description: 'Toasted bread topped with tomatoes and garlic', price: 6.25, cost: 2.00, category: 'Starters', image: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?w=500&h=400&fit=crop', isAvailable: true },
  
  // Main Course
  { name: 'Grilled Chicken', description: 'Succulent grilled chicken breast with sides', price: 12.99, cost: 5.50, category: 'Main Course', image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500&h=400&fit=crop', isAvailable: true, isPopular: true },
  { name: 'Pasta Carbonara', description: 'Classic creamy pasta with pancetta', price: 11.50, cost: 4.80, category: 'Main Course', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&h=400&fit=crop', isAvailable: true },
  { name: 'Vegetable Curry', description: 'Hearty vegetables in a spicy curry sauce', price: 10.99, cost: 4.00, category: 'Main Course', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=400&fit=crop', isAvailable: true },
  { name: 'Beef Steak', description: 'Premium cut beef steak grilled to perfection', price: 18.99, cost: 8.50, category: 'Main Course', image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=500&h=400&fit=crop', isAvailable: true, isPopular: true },
  
  // Desserts
  { name: 'Chocolate Lava Cake', description: 'Warm cake with a molten chocolate center', price: 6.99, cost: 2.50, category: 'Desserts', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&h=400&fit=crop', isAvailable: true, isPopular: true },
  { name: 'Ice Cream Sundae', description: 'Three scoops of vanilla ice cream with toppings', price: 5.50, cost: 1.80, category: 'Desserts', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&h=400&fit=crop', isAvailable: true },
  { name: 'Cheesecake', description: 'Creamy New York style cheesecake', price: 6.50, cost: 2.20, category: 'Desserts', image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&h=400&fit=crop', isAvailable: true },
  
  // Beverages
  { name: 'Fresh Juice', description: 'Squeezed to order seasonal fruit juice', price: 3.99, cost: 1.20, category: 'Beverages', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=400&fit=crop', isAvailable: true },
  { name: 'Iced Coffee', description: 'Strong brewed coffee served cold with milk', price: 4.25, cost: 1.30, category: 'Beverages', image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500&h=400&fit=crop', isAvailable: true },
  { name: 'Herbal Tea', description: 'Refreshing blend of organic herbs', price: 2.99, cost: 0.80, category: 'Beverages', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&h=400&fit=crop', isAvailable: true },
  
  // Specials
  { name: "Chef's Platter", description: 'A selection of our best dishes to share', price: 25.00, cost: 11.00, category: 'Specials', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=400&fit=crop', isAvailable: true, isPopular: true },
  { name: 'Weekend BBQ Set', description: 'Grilled meats and sides, only available Sat-Sun', price: 22.50, cost: 9.50, category: 'Specials', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500&h=400&fit=crop', isAvailable: true, isPopular: true },
  { name: 'Spicy Seafood Medley', description: 'Assorted seafood in a zesty tomato sauce', price: 19.99, cost: 9.00, category: 'Specials', image: 'https://images.unsplash.com/photo-1534080391025-0967c9c1d374?w=500&h=400&fit=crop', isAvailable: true }
];

// Sample Users
const users = [
  {
    name: 'John Customer',
    email: 'customer@foodhub.lk',
    password: 'password123',
    role: 'customer',
    phone: '+94771234567'
  },
  {
    name: 'Sarah Cashier',
    email: 'cashier@foodhub.lk',
    password: 'password123',
    role: 'cashier',
    phone: '+94771234568'
  },
  {
    name: 'Admin User',
    email: 'admin@foodhub.lk',
    password: 'adminpassword123',
    role: 'admin',
    phone: '+94771234569'
  }
];

// Import into DB
const importData = async () => {
  try {
    await connectDBForSeeder();
    
    // Hash passwords before creating users
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );

    await FoodItem.bulkCreate(foodItems);
    await User.bulkCreate(usersWithHashedPasswords);

    console.log('Data Imported...');
    process.exit(0);
  } catch (err) {
    console.error('Import error:', err);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await connectDBForSeeder();
    
    await FoodItem.destroy({ where: {} });
    await User.destroy({ where: {} });

    console.log('Data Destroyed...');
    process.exit(0);
  } catch (err) {
    console.error('Delete error:', err);
    process.exit(1);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
