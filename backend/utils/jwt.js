const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Generate an access token for a user
 * @param {Object} user - User object containing id, email, role, and fullName
 * @returns {String} JWT access token
 */
exports.generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

/**
 * Generate a refresh token for a user
 * @param {String} userId - User ID
 * @returns {String} JWT refresh token
 */
exports.generateRefreshToken = (userId) => {
  const payload = { id: userId };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Save a refresh token to a user's refreshTokens array
 * @param {String} userId - User ID
 * @param {String} refreshToken - Refresh token to save
 * @returns {Promise<Object>} Updated user object
 */
exports.saveRefreshToken = async (userId, refreshToken) =>
  await User.findByIdAndUpdate(
    userId,
    { $push: { refreshTokens: refreshToken } },
    { new: true }
  );

/**
 * Remove a refresh token from a user's refreshTokens array
 * @param {String} userId - User ID
 * @param {String} refreshToken - Refresh token to remove
 * @returns {Promise<Object>} Updated user object
 */
exports.removeRefreshToken = async (userId, refreshToken) =>
  await User.findByIdAndUpdate(
    userId,
    { $pull: { refreshTokens: refreshToken } },
    { new: true }
  );
