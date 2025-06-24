const express = require('express');

const router = express.Router();
const { setupAdmin } = require('../controllers/setup');

// POST - One-time setup for admin account
router.post('/setup-admin', setupAdmin);

module.exports = router;
