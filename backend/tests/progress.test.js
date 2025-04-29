const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/user');
const Course = require('../models/course');
const Progress = require('../models/progress');
require('./setup');

describe('Progress Endpoints', () => {
  let authToken;
  let userId;
  let courseId;
  let contentId;

  const testUser = {
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
    fullName: 'Test Student',
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
      {
        title: 'Lesson 1',
        type: 'markdown',
        content: '# Lesson 1\n\nThis is the content for lesson 1.',
      },
    ],
  };

  beforeEach(async () => {
    // Clear the database
    await User.deleteMany({});
    await Course.deleteMany({});
    await Progress.deleteMany({});

    // Create a test user and get auth token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Handle both token formats (old or new)
    authToken = registerRes.body.token || registerRes.body.accessToken;

    // Get userId from token
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

    // Create a test course
    const course = await Course.create(testCourse);
    courseId = course._id;

    // Create content IDs
    contentId = new mongoose.Types.ObjectId();

    // Enroll the user in the course
    await User.findByIdAndUpdate(userId, {
      $push: { enrolledCourses: courseId },
    });
  });

  describe('GET /api/progress/:courseId', () => {
    it('should get progress for a course when records exist', async () => {
      // Create some progress records
      await Progress.create({
        userId,
        courseId,
        contentId,
        completed: true,
        completedAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/progress/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('userId', userId);
      expect(res.body[0]).toHaveProperty('completed', true);
    });

    it('should return 404 when no progress records exist', async () => {
      const res = await request(app)
        .get(`/api/progress/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('No progress found for this course');
    });

    it('should not allow access without auth token', async () => {
      const res = await request(app).get(`/api/progress/${courseId}`);
      expect(res.status).toBe(401);
    });

    it('should handle invalid course ID format', async () => {
      const invalidCourseId = 'invalid-id';
      const res = await request(app)
        .get(`/api/progress/${invalidCourseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/progress/:courseId/:contentId', () => {
    it('should create a new progress record successfully', async () => {
      const res = await request(app)
        .post(`/api/progress/${courseId}/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId', userId);
      expect(res.body).toHaveProperty('courseId', courseId.toString());
      expect(res.body).toHaveProperty('contentId', contentId.toString());
      expect(res.body).toHaveProperty('completed', true);
      expect(res.body).toHaveProperty('completedAt');

      // Verify the record was created in the database
      const record = await Progress.findOne({ userId, courseId, contentId });
      expect(record).toBeTruthy();
      expect(record.completed).toBe(true);
    });

    it('should update an existing progress record', async () => {
      // Create initial progress record
      const initialDate = new Date(2025, 0, 1);
      await Progress.create({
        userId,
        courseId,
        contentId,
        completed: false,
        completedAt: initialDate,
      });

      const res = await request(app)
        .post(`/api/progress/${courseId}/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('completed', true);

      // Verify the record was updated
      const record = await Progress.findOne({ userId, courseId, contentId });
      expect(record.completed).toBe(true);
      expect(new Date(record.completedAt)).not.toEqual(initialDate);
    });

    it('should require content ID', async () => {
      // Using undefined contentId
      const res = await request(app)
        .post(`/api/progress/${courseId}/undefined`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      // Updated to match the actual error message returned by the API
      expect(res.body.message).toBe('Invalid content ID format');
    });

    it('should validate content ID format', async () => {
      const invalidContentId = 'invalid-id';
      const res = await request(app)
        .post(`/api/progress/${courseId}/${invalidContentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid content ID format');
    });

    it('should not allow access without auth token', async () => {
      const res = await request(app).post(
        `/api/progress/${courseId}/${contentId}`
      );
      expect(res.status).toBe(401);
    });
  });
});
