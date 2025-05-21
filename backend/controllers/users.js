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

/**
 * Get all users - Admin only
 * @route GET /api/users
 * @access Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        email: 1,
        fullName: 1,
        role: 1,
        enrolledCourses: 1,
      }
    ).populate('enrolledCourses', 'title');

    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a user - Admin only
 * @route PUT /api/users/:id
 * @access Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, enrolledCourses } = req.body;

    // Validate role if provided
    if (role && !['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be one of: student, instructor, admin',
      });
    }

    // Build update object
    const updateData = {};

    if (role) {
      updateData.role = role;
    }

    if (enrolledCourses) {
      // Validate that enrolledCourses is an array of valid MongoDB ObjectIds
      if (!Array.isArray(enrolledCourses)) {
        return res.status(400).json({
          message: 'enrolledCourses must be an array of course IDs',
        });
      }

      // Use $set to completely replace the enrolledCourses array
      updateData.enrolledCourses = enrolledCourses;
    }

    // Only proceed if there's data to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'No valid fields provided for update',
      });
    }

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('enrolledCourses', 'title');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        enrolledCourses: updatedUser.enrolledCourses,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
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
