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
const app = require('../../../index');
const Course = require('../../../models/course');
const User = require('../../../models/user');
require('../../setup');

describe('Course Content Endpoints', () => {
  let instructorToken;
  let adminToken;
  let studentToken;
  let courseId;
  let instructorUser;

  beforeAll(async () => {
    // Create test users with different roles
    instructorUser = await User.create({
      fullName: 'Test Instructor',
      email: 'instructor@test.com',
      password: 'password123',
      role: 'instructor',
    });

    const adminUser = await User.create({
      fullName: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });

    const studentUser = await User.create({
      fullName: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
    });

    // Generate tokens
    instructorToken = jwt.sign(
      {
        id: instructorUser._id,
        role: instructorUser.role,
        email: instructorUser.email,
        fullName: instructorUser.fullName,
      },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      {
        id: adminUser._id,
        role: adminUser.role,
        email: adminUser.email,
        fullName: adminUser.fullName,
      },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      {
        id: studentUser._id,
        role: studentUser.role,
        email: studentUser.email,
        fullName: studentUser.fullName,
      },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    await Course.deleteMany({});

    // Create a test course to update
    const course = await Course.create({
      title: 'Test Course',
      description: 'This is a test course',
      price: 99.99,
      instructor: new mongoose.Types.ObjectId(),
      duration: 10,
      content: [
        {
          title: 'Introduction',
          videoUrl: 'https://example.com/video1',
          type: 'video',
        },
      ],
    });
    courseId = course._id;
  });

  describe('PUT /api/courses/:id/content', () => {
    it('should return deprecation message for PUT content endpoint as instructor', async () => {
      const updatedContent = [
        {
          title: 'Updated Introduction',
          videoUrl: 'https://example.com/updated-video',
          type: 'video',
        },
        {
          title: 'New Module',
          type: 'markdown',
          content:
            '# New Module Content\n\nThis is a new module with markdown.',
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: updatedContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for PUT content endpoint as admin', async () => {
      const updatedContent = [
        {
          title: 'Admin Updated Content',
          videoUrl: 'https://example.com/admin-video',
          type: 'video',
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: updatedContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/courses/${nonExistentId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          content: [
            {
              title: 'Test Content',
              type: 'video',
              videoUrl: 'https://example.com/video',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for empty content validation', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: [] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for content type validation', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          content: [
            {
              title: 'Invalid Type',
              type: 'invalid_type', // Invalid content type
              videoUrl: 'https://example.com/video',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for markdown content validation', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          content: [
            {
              title: 'Invalid Markdown',
              type: 'markdown',
              // Missing content field
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should deny access to students', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          content: [
            {
              title: 'Student Content',
              type: 'video',
              videoUrl: 'https://example.com/student-video',
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/courses/:id/content - Multiple Choice Quiz', () => {
    it('should return deprecation message for multiple choice quiz content', async () => {
      const updatedContent = [
        {
          title: 'Introduction Video',
          videoUrl: 'https://example.com/video',
          type: 'video',
        },
        {
          title: 'Multiple Choice Quiz',
          type: 'multipleChoice',
          question: 'Which planet is closest to the sun?',
          options: ['Mercury', 'Venus', 'Earth', 'Mars'],
          correctOption: 0,
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: updatedContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for multiple choice quiz with too few options', async () => {
      const invalidContent = [
        {
          title: 'Multiple Choice Quiz',
          type: 'multipleChoice',
          question: 'Which planet is closest to the sun?',
          options: ['Mercury', 'Venus', 'Earth'], // Only 3 options
          correctOption: 0,
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: invalidContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for multiple choice quiz with invalid correctOption', async () => {
      const invalidContent = [
        {
          title: 'Multiple Choice Quiz',
          type: 'multipleChoice',
          question: 'Which planet is closest to the sun?',
          options: ['Mercury', 'Venus', 'Earth', 'Mars'],
          correctOption: 5, // Out of range (0-3)
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: invalidContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for multiple choice quiz missing required fields', async () => {
      const invalidContent = [
        {
          title: 'Multiple Choice Quiz',
          type: 'multipleChoice',
          // Missing question and options
          correctOption: 0,
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: invalidContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return deprecation message for multiple content types', async () => {
      const mixedContent = [
        {
          title: 'Introduction',
          type: 'video',
          videoUrl: 'https://example.com/intro',
        },
        {
          title: 'Reading Material',
          type: 'markdown',
          content: '# Main Title\n\nThis is some markdown content',
        },
        {
          title: 'Text Quiz',
          type: 'quiz',
        },
        {
          title: 'Multiple Choice Quiz',
          type: 'multipleChoice',
          question: 'Which planet is closest to the sun?',
          options: ['Mercury', 'Venus', 'Earth', 'Mars'],
          correctOption: 0,
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: mixedContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });
  });

  describe('Content Update with _id matching (Refactored)', () => {
    let existingCourse;
    let contentId1;
    let contentId2;

    beforeEach(async () => {
      // Create a course with existing content
      existingCourse = await Course.create({
        title: 'Course with Existing Content',
        description: 'Test course for _id matching',
        instructor: new mongoose.Types.ObjectId(),
        price: 50,
        duration: 40, // Duration in hours as a number
        content: [
          {
            type: 'markdown',
            title: 'Original Content 1',
            content: '# Original markdown content',
          },
          {
            type: 'video',
            title: 'Original Video',
            url: 'https://example.com/original-video.mp4',
          },
        ],
      });

      // eslint-disable-next-line no-underscore-dangle
      courseId = existingCourse._id;
      // eslint-disable-next-line no-underscore-dangle
      contentId1 = existingCourse.content[0]._id;
      // eslint-disable-next-line no-underscore-dangle
      contentId2 = existingCourse.content[1]._id;
    });

    it('should return deprecation message when _id is provided', async () => {
      const updateContent = [
        {
          // eslint-disable-next-line no-underscore-dangle
          _id: contentId1,
          type: 'markdown',
          title: 'Updated Content 1',
          content: '# Updated markdown content',
        },
        {
          // eslint-disable-next-line no-underscore-dangle
          _id: contentId2,
          type: 'video',
          title: 'Updated Video Title',
          url: 'https://example.com/updated-video.mp4',
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: updateContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should add new content item when no _id is provided', async () => {
      const newContent = [
        {
          type: 'quiz',
          title: 'New Quiz Content',
          questions: ['Question 1', 'Question 2'],
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: newContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should handle mixed update and insert operations', async () => {
      const mixedContent = [
        {
          // eslint-disable-next-line no-underscore-dangle
          _id: contentId1,
          type: 'markdown',
          title: 'Updated Markdown',
          content: '# Updated content',
        },
        {
          type: 'document',
          title: 'New Document',
          url: 'https://example.com/new-doc.pdf',
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: mixedContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return 400 for invalid _id format', async () => {
      const invalidContent = [
        {
          // eslint-disable-next-line no-underscore-dangle
          _id: 'invalid-id-format',
          type: 'markdown',
          title: 'Should Fail',
          content: 'This should not work',
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: invalidContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });

    it('should return 400 for non-existent _id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const invalidContent = [
        {
          // eslint-disable-next-line no-underscore-dangle
          _id: nonExistentId,
          type: 'markdown',
          title: 'Should Fail',
          content: 'This should not work',
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: invalidContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This endpoint is deprecated');
    });
  });
});
