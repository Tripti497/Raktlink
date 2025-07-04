// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/bloodRequests');

// Load environment variables
dotenv.config();


console.log('MongoDB URI:', process.env.MONGO_URI);
console.log('JWT Secret:', process.env.JWT_SECRET);
console.log('Node ENV:', process.env.NODE_ENV);

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect("mongodb+srv://iadityaverma201099:uL0Nq9pY6I28ETXs@raktlink.vkg9uey.mongodb.net/?retryWrites=true&w=majority&appName=RaktLink", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io setup
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on('blood_request', (data) => {
    // Emit to all potential donors in the area
    io.to(data.donorIds).emit('new_request', data.requestData);
  });
  
  socket.on('request_response', (data) => {
    // Emit to the requester
    io.to(data.requesterId).emit('donor_response', data.responseData);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Raktlink API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };