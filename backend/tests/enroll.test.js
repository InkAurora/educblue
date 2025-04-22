const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const app = require('../index');
const User = require('../models/user');
const Course = require('../models/course');
require('./setup');

describe('Enrollment Endpoints', () => {
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

  describe('POST /api/enroll', () => {
    it('should enroll user in a course successfully', async () => {
      const res = await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully enrolled in the course');

      // Verify user is enrolled
      const user = await User.findOne({ email: testUser.email });
      expect(user.enrolledCourses).toContainEqual(courseId);
    });

    it('should not allow enrollment without auth token', async () => {
      const res = await request(app).post('/api/enroll').send({ courseId });

      expect(res.status).toBe(401);
    });

    it('should not allow enrollment in non-existent course', async () => {
      const nonExistentCourseId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId: nonExistentCourseId });

      expect(res.status).toBe(404);
    });

    it('should not allow duplicate enrollment', async () => {
      // First enrollment
      await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId });

      // Attempt duplicate enrollment
      const res = await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Already enrolled in this course');
    });
  });
});
