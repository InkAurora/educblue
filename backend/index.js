const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const courseRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const enrollRoutes = require('./routes/enroll');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/enroll', enrollRoutes);

// Connect to MongoDB
const connectDB = require('./config/db');

if (process.env.NODE_ENV !== 'test') {
  connectDB();
  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
