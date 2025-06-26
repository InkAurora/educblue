const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/user');
const Course = require('../models/course');
require('./setup');

// Mock Stripe since we don't want to make actual API calls in tests
jest.mock('stripe', () => () => ({
  checkout: {
    sessions: {
      retrieve: jest.fn().mockImplementation((sessionId) => {
        if (sessionId === 'test_paid_session_id') {
          return Promise.resolve({
            id: 'test_paid_session_id',
            payment_status: 'paid',
            metadata: {
              courseId: 'courseid123',
              userId: 'userid123',
            },
          });
        }
        if (sessionId === 'test_unpaid_session_id') {
          return Promise.resolve({
            id: 'test_unpaid_session_id',
            payment_status: 'unpaid',
            metadata: {
              courseId: 'courseid123',
              userId: 'userid123',
            },
          });
        }
        return Promise.reject(new Error('Invalid session ID'));
      }),
    },
  },
}));

describe('Enrollment Endpoints', () => {
  let authToken;
  let courseId;

  const testUser = {
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
    fullName: 'Test Student', // Added fullName field
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

    // Get the user ID for the instructor field
    const user = await User.findOne({ email: testUser.email });
    const userId = user._id;

    // Create a test course with proper instructor ObjectId
    const courseData = {
      ...testCourse,
      instructor: userId,
    };
    const courseRes = await Course.create(courseData);
    courseId = courseRes._id;
  });

  describe('POST /api/enroll', () => {
    it('should enroll user with valid session ID (paid status)', async () => {
      const res = await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          sessionId: 'test_paid_session_id',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully enrolled in the course');

      // Verify user is enrolled
      const user = await User.findOne({ email: testUser.email });
      expect(
        user.enrolledCourses.some((id) => id.toString() === courseId.toString())
      ).toBe(true);
    });

    it('should reject enrollment if payment is not completed', async () => {
      const res = await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          sessionId: 'test_unpaid_session_id',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Payment not completed');

      // Verify user is not enrolled
      const user = await User.findOne({ email: testUser.email });
      expect(
        user.enrolledCourses.some((id) => id.toString() === courseId.toString())
      ).toBe(false);
    });

    it('should reject if session ID is invalid', async () => {
      const res = await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          sessionId: 'invalid_session_id',
        });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error during enrollment process');
    });

    it('should require both course ID and session ID', async () => {
      const res = await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Course ID and session ID are required');
    });

    it('should not allow enrollment without auth token', async () => {
      const res = await request(app).post('/api/enroll').send({
        courseId,
        sessionId: 'test_paid_session_id',
      });

      expect(res.status).toBe(401);
    });

    it('should not allow enrollment in non-existent course', async () => {
      const nonExistentCourseId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId: nonExistentCourseId,
          sessionId: 'test_paid_session_id',
        });

      expect(res.status).toBe(404);
    });

    it('should not allow duplicate enrollment', async () => {
      // First enrollment
      await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          sessionId: 'test_paid_session_id',
        });

      // Attempt duplicate enrollment
      const res = await request(app)
        .post('/api/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          sessionId: 'test_paid_session_id',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Already enrolled in this course');
    });
  });
  describe('POST /api/enroll/free', () => {
    let freeCourseId;
    let paidCourseId;
    let instructorId;

    beforeEach(async () => {
      // Get the instructor ID from the created user
      const user = await User.findOne({ email: testUser.email });
      instructorId = user._id;

      // Create a free course
      const freeCourse = await Course.create({
        title: 'Free Test Course',
        description: 'A free course for testing',
        price: 0,
        duration: 5,
        instructor: instructorId,
        status: 'published',
      });
      freeCourseId = freeCourse._id;

      // Create a paid course
      const paidCourse = await Course.create({
        title: 'Paid Test Course',
        description: 'A paid course for testing',
        price: 99.99,
        duration: 10,
        instructor: instructorId,
        status: 'published',
      });
      paidCourseId = paidCourse._id;
    });

    it('should successfully enroll in a free course', async () => {
      const res = await request(app)
        .post('/api/enroll/free')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId: freeCourseId,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully enrolled in the free course');
      expect(res.body.course).toBeDefined();
      expect(res.body.course.title).toBe('Free Test Course');
      expect(res.body.course.price).toBe(0);
    });

    it('should not allow enrollment in paid courses', async () => {
      const res = await request(app)
        .post('/api/enroll/free')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId: paidCourseId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        'This course is not free. Please use the regular enrollment process.'
      );
    });

    it('should require authentication', async () => {
      const res = await request(app).post('/api/enroll/free').send({
        courseId: freeCourseId,
      });

      expect(res.status).toBe(401);
    });

    it('should require courseId', async () => {
      const res = await request(app)
        .post('/api/enroll/free')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Course ID is required');
    });

    it('should not allow enrollment in non-existent course', async () => {
      const nonExistentCourseId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/enroll/free')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId: nonExistentCourseId,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Course not found');
    });

    it('should not allow duplicate enrollment', async () => {
      // First enrollment
      await request(app)
        .post('/api/enroll/free')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId: freeCourseId,
        });

      // Attempt duplicate enrollment
      const res = await request(app)
        .post('/api/enroll/free')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId: freeCourseId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Already enrolled in this course');
    });

    it('should not allow enrollment in unpublished courses', async () => {
      // Create an unpublished free course
      const unpublishedCourse = await Course.create({
        title: 'Unpublished Free Course',
        description: 'An unpublished free course',
        price: 0,
        duration: 3,
        instructor: instructorId,
        status: 'draft',
      });

      const res = await request(app)
        .post('/api/enroll/free')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId: unpublishedCourse._id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Course is not available for enrollment');
    });
  });
});
