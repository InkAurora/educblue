// filepath: c:\Users\INK\Desktop\educblue\backend\tests\courses.content.test.js
const {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
} = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../index');
const Course = require('../models/course');
const User = require('../models/user');
require('./setup');

describe('Course Content Endpoints', () => {
  let instructorToken;
  let studentToken;
  let nonEnrolledToken;
  let instructorId;
  let studentId;
  let nonEnrolledId;
  let courseId;
  let contentId;

  beforeAll(async () => {
    // Create test users with different roles
    const instructorUser = await User.create({
      fullName: 'Test Instructor',
      email: 'instructor@test.com',
      password: 'password123',
      role: 'instructor',
    });
    instructorId = instructorUser.id;

    const studentUser = await User.create({
      fullName: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
    });
    studentId = studentUser.id;

    const nonEnrolledUser = await User.create({
      fullName: 'Non Enrolled Student',
      email: 'nonenrolled@test.com',
      password: 'password123',
      role: 'student',
    });
    nonEnrolledId = nonEnrolledUser.id;

    // Generate tokens
    instructorToken = jwt.sign(
      {
        id: instructorUser.id,
        role: instructorUser.role,
        email: instructorUser.email,
        fullName: instructorUser.fullName,
      },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      {
        id: studentUser.id,
        role: studentUser.role,
        email: studentUser.email,
        fullName: studentUser.fullName,
      },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );

    nonEnrolledToken = jwt.sign(
      {
        id: nonEnrolledUser.id,
        role: nonEnrolledUser.role,
        email: nonEnrolledUser.email,
        fullName: nonEnrolledUser.fullName,
      },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );

    // Create a test course
    const course = await Course.create({
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
            {
              title: 'Markdown Lesson',
              type: 'markdown',
              content:
                '# Lesson 1\n\nThis is a markdown lesson with code:\n```javascript\nconst x = 1;\n```',
            },
          ],
        },
      ],
    });
    courseId = course.id;
    contentId = course.sections[0].content[0].id; // Get the ID of the first content item

    // Enroll the student in the course
    await User.findByIdAndUpdate(studentId, {
      $addToSet: { enrolledCourses: courseId },
    });
  });

  beforeEach(async () => {
    // Reset any state if needed between tests
  });

  describe('GET /api/courses/:id/content/:contentId', () => {
    it('should return deprecation message for enrolled student', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/content/${contentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for instructor', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/content/${contentId}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for non-enrolled user', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/content/${contentId}`)
        .set('Authorization', `Bearer ${nonEnrolledToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for invalid course ID', async () => {
      const invalidCourseId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/courses/${invalidCourseId}/content/${contentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for invalid content ID', async () => {
      const invalidContentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/courses/${courseId}/content/${invalidContentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return 401 when no authentication token provided', async () => {
      const res = await request(app).get(
        `/api/courses/${courseId}/content/${contentId}`
      );

      expect(res.status).toBe(401);
    });
  });
});
