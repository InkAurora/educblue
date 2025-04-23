const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/users');
const auth = require('../middleware/auth');

// GET - Get user profile
router.get('/me', auth, getUserProfile);

module.exports = router;
