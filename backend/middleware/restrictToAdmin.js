// filepath: c:\Users\INK\Desktop\educblue\backend\middleware\restrictToAdmin.js
/**
 * Middleware to restrict access to admin users only
 * This middleware should be used after the auth middleware
 * which validates the JWT token and sets req.user
 */
function restrictToAdmin(req, res, next) {
  // Check if user exists and has a role
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check if user's role is admin
  if (req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Access denied. Admin permissions required' });
  }

  next();
}

module.exports = restrictToAdmin;
