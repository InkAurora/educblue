const User = require('../models/user');

/**
 * Get the profile of the currently logged-in user
 * @route GET /api/users/me
 * @access Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user.user.id;

    // Find user by ID and populate enrolledCourses
    const user = await User.findById(userId).populate('enrolledCourses');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return only necessary user data
    return res.json({
      email: user.email,
      role: user.role,
      enrolledCourses: user.enrolledCourses,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
