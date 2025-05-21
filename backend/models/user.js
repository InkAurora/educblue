const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student',
  },
  refreshTokens: {
    type: [String],
    default: [],
  },
  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to hash password
userSchema.pre('save', async function hashPassword(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password using the new salt
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
