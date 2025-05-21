const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const auth = require('../middleware/auth');
const restrictToAdmin = require('../middleware/restrictToAdmin');

// Regular user routes
// GET - Get user profile
router.get('/me', auth, userController.getUserProfile);

// PUT - Update user profile
router.put('/me', auth, userController.updateUserProfile);

// Admin routes
// GET - Get all users (admin only)
router.get('/', auth, restrictToAdmin, userController.getAllUsers);

// PUT - Update a specific user (admin only)
router.put('/:id', auth, restrictToAdmin, userController.updateUser);

// DELETE - Delete a specific user (admin only)
router.delete('/:id', auth, restrictToAdmin, userController.deleteUser);

module.exports = router;
