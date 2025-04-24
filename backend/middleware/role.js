/**
 * Middleware to restrict route access based on user role
 * @param {...string} roles - Allowed roles for the route
 * @returns {Function} Express middleware function
 */
const restrictTo =
  (...roles) =>
  (req, res, next) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };

module.exports = restrictTo;
