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
      instructor: instructorUser.fullName,
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
    it('should update course content successfully as instructor', async () => {
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

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('updated successfully');
      expect(res.body.course.content).toHaveLength(2);
      expect(res.body.course.content[0].title).toBe('Updated Introduction');
      expect(res.body.course.content[1].type).toBe('markdown');
    });

    it('should update course content successfully as admin', async () => {
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

      expect(res.status).toBe(200);
      expect(res.body.course.content[0].title).toBe('Admin Updated Content');
    });

    it('should return 404 when updating content for non-existent course', async () => {
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

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('should validate content array is not empty', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: [] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('non-empty array');
    });

    it('should validate content type', async () => {
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
      expect(res.body.message).toContain('valid type');
    });

    it('should validate markdown content has content field', async () => {
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
      expect(res.body.message).toContain('content field');
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
    it('should update course with valid multiple choice quiz content', async () => {
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

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('updated successfully');

      // Check multiple choice content
      const quiz = res.body.course.content.find(
        (c) => c.type === 'multipleChoice'
      );
      expect(quiz).toBeDefined();
      expect(quiz.title).toBe('Multiple Choice Quiz');
      expect(quiz.question).toBe('Which planet is closest to the sun?');
      expect(quiz.options).toHaveLength(4);
      expect(quiz.options[0]).toBe('Mercury');
      expect(quiz.correctOption).toBe(0);
    });

    it('should reject update with multiple choice quiz having fewer than 4 options', async () => {
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
      expect(res.body.message).toContain(
        'Multiple choice questions must include'
      );
    });

    it('should reject update with multiple choice quiz having invalid correctOption', async () => {
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
      expect(res.body.message).toContain(
        'Multiple choice questions must include'
      );
    });

    it('should reject update with multiple choice quiz missing required fields', async () => {
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
      expect(res.body.message).toContain(
        'Multiple choice questions must include'
      );
    });

    it('should handle multiple content types including multiple choice quizzes', async () => {
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

      expect(res.status).toBe(200);
      expect(res.body.course.content).toHaveLength(4);

      // Check each content type
      expect(
        res.body.course.content.find((c) => c.type === 'video')
      ).toBeDefined();
      expect(
        res.body.course.content.find((c) => c.type === 'markdown')
      ).toBeDefined();
      expect(
        res.body.course.content.find((c) => c.type === 'quiz')
      ).toBeDefined();
      expect(
        res.body.course.content.find((c) => c.type === 'multipleChoice')
      ).toBeDefined();
    });
  });
});
