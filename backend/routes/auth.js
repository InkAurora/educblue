const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
} = require('../controllers/auth');
const auth = require('../middleware/auth');

router.post('/register', register); // role defaults to 'student', instructor registration restricted
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', auth, logout);

module.exports = router;
