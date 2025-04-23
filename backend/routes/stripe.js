const express = require('express');

const router = express.Router();
const auth = require('../middleware/auth');
const stripeController = require('../controllers/stripe');

// POST - Create checkout session
router.post('/checkout', auth, stripeController.createCheckoutSession);

module.exports = router;
