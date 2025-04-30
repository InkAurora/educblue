const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const jwtUtils = require('../../utils/jwt');

// Login a user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate tokens using utility functions
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user.id);

    // Save refresh token to user's refreshTokens array
    await jwtUtils.saveRefreshToken(user.id, refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  // Check if refresh token exists
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    // Find user with the provided refresh token
    const user = await User.findOne({ refreshTokens: refreshToken });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const token = jwtUtils.generateAccessToken(user);

    res.json({ token });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout a user
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  // Check if refresh token exists
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    // Remove the refresh token from the user's refreshTokens array
    await jwtUtils.removeRefreshToken(req.user.id, refreshToken);

    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
