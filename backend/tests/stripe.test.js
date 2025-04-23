const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const app = require('../index');
const User = require('../models/user');
const Course = require('../models/course');
require('./setup');

// Mock Stripe since we don't want to make actual API calls in tests
jest.mock('stripe', () => {
  return () => ({
    checkout: {
      sessions: {
        create: jest.fn().mockImplementation(() =>
          Promise.resolve({
            id: 'test_session_id',
            url: 'https://stripe.com/test_checkout',
          })
        ),
      },
    },
  });
});

describe('Stripe Endpoints', () => {
  let authToken;
  let courseId;

  const testUser = {
    email: 'student@test.com',
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

    // Create a test course
    const courseRes = await Course.create(testCourse);
    courseId = courseRes._id;
  });

  describe('POST /api/stripe/checkout', () => {
    it('should create a checkout session successfully', async () => {
      const res = await request(app)
        .post('/api/stripe/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('sessionId');
    });

    it('should not allow checkout without auth token', async () => {
      const res = await request(app)
        .post('/api/stripe/checkout')
        .send({ courseId });

      expect(res.status).toBe(401);
    });

    it('should not allow checkout with non-existent course ID', async () => {
      const nonExistentCourseId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/stripe/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId: nonExistentCourseId });

      expect(res.status).toBe(404);
    });

    it('should require a course ID', async () => {
      const res = await request(app)
        .post('/api/stripe/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
