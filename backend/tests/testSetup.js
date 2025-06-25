// testSetup.js
// Global test setup for all tests
const User = require('../models/user'); // Assuming user model path

async function setupUsers() {
  // Clear existing users to ensure a clean state for each test suite
  await User.deleteMany({});

  // Create an admin user
  const adminUser = new User({
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: 'password123', // Store plain password, model will hash it
    role: 'admin',
    isVerified: true, // Ensure user is verified for login
  });
  await adminUser.save();

  // Create an instructor user
  const instructorUser = new User({
    fullName: 'Instructor User',
    email: 'instructor@example.com',
    password: 'password123', // Store plain password, model will hash it
    role: 'instructor',
    isVerified: true, // Ensure user is verified for login
  });
  await instructorUser.save();

  // Return user objects for use in tests
  return { adminUser, instructorUser };
}

module.exports = { setupUsers };
