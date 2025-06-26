const User = require('../models/user');

/**
 * Setup an admin account - One-time use endpoint
 * @route POST /api/setup-admin
 * @access Protected by secret key
 */
exports.setupAdmin = async (req, res) => {
  try {
    const { email, secretKey } = req.body;

    // Validate inputs
    if (!email || !secretKey) {
      return res.status(400).json({
        message: 'Email and secretKey are required',
      });
    }

    // Validate the secret key against environment variable
    // This is a hard-coded check for demonstration purposes
    // In production, use a strong secret key stored in environment variables
    if (secretKey !== process.env.ADMIN_SETUP_SECRET) {
      return res.status(403).json({
        message: 'Invalid secret key',
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found with this email',
      });
    }

    // Update the user role to admin
    user.role = 'admin';
    await user.save();

    return res.json({
      message: 'User promoted to admin successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error setting up admin:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
