const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const stripe = require('stripe');
const courseRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const enrollRoutes = require('./routes/enroll');
const stripeRoutes = require('./routes/stripe');
const userRoutes = require('./routes/users');
const progressRoutes = require('./routes/progress');
const analyticsRoutes = require('./routes/analytics');
const setupRoutes = require('./routes/setup');

// Load environment variables
dotenv.config();

const app = express();

// Initialize Stripe with secret key
// We initialize it here for potential global usage
// eslint-disable-next-line no-unused-vars
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://educblue.vercel.app/',
      'https://educblue-dev.vercel.app/',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
); // Enable CORS specifically for frontend

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/enroll', enrollRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', setupRoutes);

// Connect to MongoDB
const connectDB = require('./config/db');

if (process.env.NODE_ENV !== 'test') {
  connectDB();
  // Start server
  const PORT = process.env.PORT || 5000;
  // eslint-disable-next-line no-console
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
