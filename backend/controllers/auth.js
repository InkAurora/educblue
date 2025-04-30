// Import functionality from submodules
const { register } = require('./auth/register');
const { login, refreshToken, logout } = require('./auth/login');

// Export all functionality
module.exports = {
  // Registration functionality
  register,

  // Login/session functionality
  login,
  refreshToken,
  logout,
};
