const User = require('../models/user');

/**
 * Get the profile of the currently logged-in user
 * @route GET /api/users/me
 * @access Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user.id;

    // Find user by ID and populate enrolledCourses
    const user = await User.findById(userId).populate('enrolledCourses');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data with the requested fields
    return res.json({
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      enrolledCourses: user.enrolledCourses,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update the profile of the currently logged-in user
 * @route PUT /api/users/me
 * @access Private
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { fullName, bio, phoneNumber } = req.body;

    // Validate fullName is a non-empty string
    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
      return res.status(400).json({ message: 'Full name is required' });
    }

    // Build update object
    const profileUpdate = {
      fullName,
    };

    // Add optional fields if provided
    if (bio !== undefined) {
      profileUpdate.bio = bio;
    }

    if (phoneNumber !== undefined) {
      profileUpdate.phoneNumber = phoneNumber;
    }

    // Find user by ID and update profile
    const user = await User.findByIdAndUpdate(
      req.user.id,
      profileUpdate,
      { new: true } // Return the updated document
    ).populate('enrolledCourses');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return updated user data
    return res.json({
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      enrolledCourses: user.enrolledCourses,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Export functions from userManagement.js for admin operations
const {
  getAllUsers,
  updateUser,
  deleteUser,
} = require('./users/userManagement');

exports.getAllUsers = getAllUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
