const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/user');
const Course = require('../models/course');
require('./setup');

describe('User Profile Endpoints', () => {
  let authToken;
  let userId;
  let courseId;

  const testUser = {
    email: 'testuser@example.com',
    password: 'password123',
    role: 'student',
  };

  const testCourse = {
    title: 'Test Course',
    description: 'This is a test course',
    price: 99.99,
    instructor: 'Test Instructor',
    duration: 10,
    content: [
      {
        title: 'Introduction',
        videoUrl: 'https://example.com/video1',
        type: 'video',
      },
    ],
  };

  beforeEach(async () => {
    // Clear the database
    await User.deleteMany({});
    await Course.deleteMany({});

    // Create a test user and get auth token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    authToken = registerRes.body.token;

    // Store the user ID for later use
    const payload = JSON.parse(
      Buffer.from(authToken.split('.')[1], 'base64').toString()
    );
    userId = payload.user.id;

    // Create a test course
    const course = await Course.create(testCourse);
    courseId = course._id;

    // Add course to user's enrolled courses
    await User.findByIdAndUpdate(userId, {
      $push: { enrolledCourses: courseId },
    });
  });

  describe('GET /api/users/me', () => {
    it('should get the user profile successfully', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('role', testUser.role);
      expect(res.body).toHaveProperty('enrolledCourses');
      expect(Array.isArray(res.body.enrolledCourses)).toBe(true);
      expect(res.body.enrolledCourses.length).toBe(1);
      expect(res.body.enrolledCourses[0].title).toBe(testCourse.title);
    });

    it('should not allow access without auth token', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(401);
    });

    it('should return 404 if user does not exist', async () => {
      // Delete the user to simulate non-existent user
      await User.findByIdAndDelete(userId);

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(401);
    });
  });
});
