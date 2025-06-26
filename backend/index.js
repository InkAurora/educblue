const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
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
// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));

// Parse CORS origins from environment variable
const allowedOrigins = process.env.APP_URL
  ? process.env.APP_URL.split(',')
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
); // Enable CORS specifically for frontend

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/enroll', enrollRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', setupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Custom 404 middleware (should be after all route handlers)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  next();
});

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
