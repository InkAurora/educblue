const mongoose = require('mongoose');
const { describe, it, expect, afterAll } = require('@jest/globals');
const User = require('../../models/user');
require('../../tests/testSetup'); // Import for setup but don't redeclare jest

describe('User Model', () => {
  it('should create a valid user with default role as student', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await User.create(userData);
    expect(user.role).toBe('student');
    expect(user.fullName).toBe(userData.fullName);
    expect(user.email).toBe(userData.email);
  }, 30000); // Explicit timeout of 30 seconds

  it('should accept valid roles: student, instructor, admin', async () => {
    // Test student role
    const studentUser = await User.create({
      fullName: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      role: 'student',
    });
    expect(studentUser.role).toBe('student');

    // Test instructor role
    const instructorUser = await User.create({
      fullName: 'Instructor User',
      email: 'instructor@example.com',
      password: 'password123',
      role: 'instructor',
    });
    expect(instructorUser.role).toBe('instructor');

    // Test admin role
    const adminUser = await User.create({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(adminUser.role).toBe('admin');
  }, 30000); // Explicit timeout of 30 seconds

  it('should reject invalid roles', async () => {
    const userData = {
      fullName: 'Invalid Role User',
      email: 'invalid@example.com',
      password: 'password123',
      role: 'invalid-role',
    };

    await expect(User.create(userData)).rejects.toThrow();
  }, 30000); // Explicit timeout of 30 seconds

  it('should store enrolled courses as references', async () => {
    // Create a mock course ID
    const courseId = new mongoose.Types.ObjectId();

    const userData = {
      fullName: 'Enrolled User',
      email: 'enrolled@example.com',
      password: 'password123',
      enrolledCourses: [courseId],
    };

    const user = await User.create(userData);
    expect(user.enrolledCourses).toHaveLength(1);
    expect(user.enrolledCourses[0].toString()).toBe(courseId.toString());
  }, 30000); // Explicit timeout of 30 seconds

  // Clean up after tests
  afterAll(async () => {
    await User.deleteMany({});
  });
});
