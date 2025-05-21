const User = require('../../models/user');
const jwtUtils = require('../../utils/jwt');

// Register a new user
exports.register = async (req, res) => {
  const { email, password, role, fullName } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Use provided fullName or generate one from email
    const userFullName = fullName || email.split('@')[0];

    user = new User({
      email,
      password, // Password will be hashed by the pre-save hook in the User model
      role,
      fullName: userFullName,
    });

    await user.save();

    // Generate tokens using utility functions
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user.id);

    // Save refresh token to user's refreshTokens array
    await jwtUtils.saveRefreshToken(user.id, refreshToken);

    return res.status(201).json({ accessToken, refreshToken }); // Ensure response is returned
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message }); // Ensure response is returned
  }
};
