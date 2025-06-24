// filepath: c:\Users\INK\Desktop\educblue\backend\routes\analytics.js
const express = require('express');

const router = express.Router();
const analytics = require('../controllers/analytics');
const auth = require('../middleware/auth');
const restrictToAdmin = require('../middleware/restrictToAdmin');

// GET - Get global platform analytics
router.get('/', auth, restrictToAdmin, analytics.getGlobalAnalytics);

// GET - Get user activity analytics
router.get('/users', auth, restrictToAdmin, analytics.getUserAnalytics);

// GET - Get financial analytics
router.get(
  '/financial',
  auth,
  restrictToAdmin,
  analytics.getFinancialAnalytics
);

module.exports = router;
