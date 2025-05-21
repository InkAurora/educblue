/**
 * Middleware to restrict route access based on user role
 * @param {...string} roles - Allowed roles for the route
 * @returns {Function} Express middleware function
 */
const restrictTo =
  (...roles) =>
  (req, res, next) => {
    // auth middleware should ensure req.user is populated if token is valid
    if (!roles.includes(req.user?.role)) {
      return res
        .status(403)
        .json({ message: 'Access denied. You do not have the required role.' });
    }

    next();
  };

module.exports = restrictTo;
