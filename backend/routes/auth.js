const express = require('express');

const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
} = require('../controllers/auth');
const auth = require('../middleware/auth');

// ⚠️ IMPORTANT: When modifying these routes, update ../API.md documentation
// Each route change must include: method, path, auth requirements, request/response examples

// POST /api/auth/register - Register new user (students only)
// Documented in API.md: Authentication Endpoints > Register User
router.post('/register', register); // role defaults to 'student', instructor registration restricted

// POST /api/auth/login - User login
// Documented in API.md: Authentication Endpoints > Login User
router.post('/login', login);

// POST /api/auth/refresh - Refresh access token
// Documented in API.md: Authentication Endpoints > Refresh Token
router.post('/refresh', refreshToken);

// POST /api/auth/logout - User logout (requires auth)
// Documented in API.md: Authentication Endpoints > Logout User
router.post('/logout', auth, logout);

module.exports = router;
