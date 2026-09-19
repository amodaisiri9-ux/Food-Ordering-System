const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const { syncDatabase } = require('./utils/syncDatabase');
require('./models'); // Load associations

// Route files
const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Load env vars
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinOrder', (orderNumber) => {
    socket.join(orderNumber);
    console.log(`User joined order room: ${orderNumber}`);
  });

  socket.on('leaveOrder', (orderNumber) => {
    socket.leave(orderNumber);
    console.log(`User left order room: ${orderNumber}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

const errorHandler = require('./middleware/errorHandler');

// Basic Route
app.get('/', (req, res) => {
  res.send('Food Hub API is running with Socket.io and Image Upload support...');
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await syncDatabase();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
