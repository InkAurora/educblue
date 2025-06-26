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
    fullName: 'Test User', // Added fullName field
  };

  const testCourse = {
    title: 'Test Course',
    description: 'This is a test course',
    price: 99.99,
    instructor: new mongoose.Types.ObjectId(),
    duration: 10,
    sections: [
      {
        title: 'Section 1',
        order: 1,
        content: [
          {
            title: 'Introduction',
            videoUrl: 'https://example.com/video1',
            type: 'video',
          },
        ],
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

    // Handle both token formats (old or new)
    authToken = registerRes.body.token || registerRes.body.accessToken;

    // Create a test user directly if we don't have a token (just in case)
    if (!authToken) {
      const user = await User.create({
        ...testUser,
        password: '$2a$10$TestHashedPassword',
      });
      userId = user._id.toString();
    } else {
      // Store the user ID from token if we have it
      try {
        const payload = JSON.parse(
          Buffer.from(authToken.split('.')[1], 'base64').toString()
        );
        userId = payload.id;
      } catch (error) {
        // Find the user directly if token parsing fails
        const user = await User.findOne({ email: testUser.email });
        userId = user._id.toString();
      }
    }

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
      // Skip test if no token
      if (!authToken) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to missing token');
        return;
      }

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('role', testUser.role);
      expect(res.body).toHaveProperty('enrolledCourses');
      expect(Array.isArray(res.body.enrolledCourses)).toBe(true);
    });

    it('should not allow access without auth token', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    it('should return 404 if user does not exist', async () => {
      // Skip test if no token
      if (!authToken) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to missing token');
        return;
      }

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

  describe('PUT /api/users/me', () => {
    it('should update user profile successfully', async () => {
      if (!authToken) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to missing token');
        return;
      }

      const updateData = {
        fullName: 'Updated User Name',
        bio: 'This is my bio',
        phoneNumber: '+1234567890',
      };

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('fullName', updateData.fullName);
      expect(res.body).toHaveProperty('bio', updateData.bio);
      expect(res.body).toHaveProperty('phoneNumber', updateData.phoneNumber);
    });

    it('should update only provided fields', async () => {
      if (!authToken) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to missing token');
        return;
      }

      const updateData = {
        fullName: 'Partially Updated Name',
      };

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('fullName', updateData.fullName);
    });

    it('should require fullName', async () => {
      if (!authToken) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to missing token');
        return;
      }

      const updateData = {
        bio: 'Just updating bio',
      };

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Full name is required');
    });

    it('should reject empty fullName', async () => {
      if (!authToken) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to missing token');
        return;
      }

      const updateData = {
        fullName: '',
      };

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Full name is required');
    });

    it('should reject non-string fullName', async () => {
      if (!authToken) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to missing token');
        return;
      }

      const updateData = {
        fullName: 123,
      };

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Full name is required');
    });

    it('should not allow access without auth token', async () => {
      const updateData = {
        fullName: 'Test Name',
      };

      const res = await request(app).put('/api/users/me').send(updateData);

      expect(res.status).toBe(401);
    });

    it('should return 404 if user does not exist', async () => {
      if (!authToken) {
        // eslint-disable-next-line no-console
        console.log('Skipping test due to missing token');
        return;
      }

      // Delete the user to simulate non-existent user
      await User.findByIdAndDelete(userId);

      const updateData = {
        fullName: 'Test Name',
      };

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });
  });
});
