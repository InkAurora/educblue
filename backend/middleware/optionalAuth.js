const jwt = require('jsonwebtoken');

// Optional authentication middleware - doesn't require token but sets req.user if valid token provided
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    // No token provided - continue without setting req.user
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user data to request
    return next();
  } catch (error) {
    // Invalid token - continue without setting req.user
    // This allows the route to work in public mode
    return next();
  }
};

module.exports = optionalAuth;
