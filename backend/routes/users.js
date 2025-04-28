const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/users');
const auth = require('../middleware/auth');

// GET - Get user profile
router.get('/me', auth, getUserProfile);

// PUT - Update user profile
router.put('/me', auth, updateUserProfile);

module.exports = router;
