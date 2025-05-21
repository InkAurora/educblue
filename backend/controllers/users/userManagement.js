const User = require('../../models/user');

/**
 * Get all users - Admin only
 * @route GET /api/users
 * @access Admin
 */
const getAllUsers = async (req, res) => {
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
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'User ID cannot be undefined' });
    }

    const { role, enrolledCourses } = req.body;

    // Find the user first to check their current role
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from being demoted
    if (userToUpdate.role === 'admin' && role && role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Admin accounts cannot be demoted.' });
    }

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

/**
 * Delete a user - Admin only
 * @route DELETE /api/users/:id
 * @access Admin
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToDelete.role === 'admin') {
      return res
        .status(403)
        .json({ message: 'Admin accounts cannot be deleted.' });
    }

    await User.findByIdAndDelete(id);

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Fix the exporting of functions
module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
};
