const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

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
      password,
      role,
      fullName: userFullName,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Generate access token
    const accessPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = jwt.sign(accessPayload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Generate refresh token
    const refreshPayload = { id: user.id };
    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Save refresh token to user's refreshTokens array
    await User.findByIdAndUpdate(user.id, {
      $push: { refreshTokens: refreshToken },
    });

    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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

    // Generate access token
    const accessPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = jwt.sign(accessPayload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Generate refresh token
    const refreshPayload = { id: user.id };
    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Save refresh token to user's refreshTokens array
    await User.findByIdAndUpdate(user.id, {
      $push: { refreshTokens: refreshToken },
    });

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
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

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
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { refreshTokens: refreshToken },
    });

    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
