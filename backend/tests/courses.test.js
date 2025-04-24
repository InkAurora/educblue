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

describe('Course Endpoints', () => {
  let instructorToken;
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    // Create test users with different roles
    const instructorUser = await User.create({
      name: 'Test Instructor',
      email: 'instructor@test.com',
      password: 'password123',
      role: 'instructor',
    });

    const adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });

    const studentUser = await User.create({
      name: 'Test Student',
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
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role, email: adminUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      { id: studentUser._id, role: studentUser.role, email: studentUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    await Course.deleteMany({});
  });

  const sampleCourse = {
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

  const sampleMarkdownCourse = {
    title: 'Markdown Course',
    description: 'Course with markdown',
    markdownDescription:
      '# Main Title\n\nMarkdown course description with **bold** and *italic* text.',
    price: 79.99,
    instructor: 'Markdown Instructor',
    duration: 8,
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
      {
        title: 'Quiz',
        type: 'quiz',
      },
    ],
  };

  describe('POST /api/courses', () => {
    it('should create a new course successfully as instructor', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(sampleCourse);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe(sampleCourse.title);
      expect(res.body.description).toBe(sampleCourse.description);
    });

    it('should create a course with markdown description and content as admin', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleMarkdownCourse);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.markdownDescription).toBe(
        sampleMarkdownCourse.markdownDescription
      );
      expect(res.body.content).toHaveLength(3);

      // Check markdown content
      const markdownContent = res.body.content.find(
        (c) => c.type === 'markdown'
      );
      expect(markdownContent).toBeDefined();
      expect(markdownContent.content).toBe(
        sampleMarkdownCourse.content[1].content
      );
    });

    it('should validate markdown description type', async () => {
      const invalidCourse = {
        ...sampleCourse,
        markdownDescription: 123, // Should be a string
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidCourse);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Markdown description must be a string'
      );
    });

    it('should validate content types', async () => {
      const invalidContentCourse = {
        ...sampleCourse,
        content: [
          {
            title: 'Invalid Content',
            type: 'invalid_type', // Invalid content type
          },
        ],
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidContentCourse);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Content items must have a valid type'
      );
    });

    it('should validate markdown content', async () => {
      const invalidMarkdownCourse = {
        ...sampleCourse,
        content: [
          {
            title: 'Invalid Markdown',
            type: 'markdown',
            // Missing content field
          },
        ],
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidMarkdownCourse);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Markdown content items must include a content field'
      );
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should deny access to students', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(sampleCourse);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/courses', () => {
    it('should get all courses', async () => {
      // Create test courses
      await Course.create(sampleCourse);
      await Course.create({
        ...sampleCourse,
        title: 'Another Course',
      });

      const res = await request(app).get('/api/courses');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
    });

    it('should include markdown content in course list', async () => {
      await Course.create(sampleMarkdownCourse);

      const res = await request(app).get('/api/courses');

      expect(res.status).toBe(200);
      expect(res.body[0].markdownDescription).toBe(
        sampleMarkdownCourse.markdownDescription
      );
      expect(
        res.body[0].content.find((c) => c.type === 'markdown')
      ).toBeDefined();
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should get course by id', async () => {
      const course = await Course.create(sampleCourse);

      const res = await request(app).get(`/api/courses/${course._id}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(course._id.toString());
      expect(res.body.title).toBe(course.title);
    });

    it('should get markdown course by id with all content', async () => {
      const course = await Course.create(sampleMarkdownCourse);

      const res = await request(app).get(`/api/courses/${course._id}`);

      expect(res.status).toBe(200);
      expect(res.body.markdownDescription).toBe(
        sampleMarkdownCourse.markdownDescription
      );

      // Check markdown content is returned correctly
      const markdownContent = res.body.content.find(
        (c) => c.type === 'markdown'
      );
      expect(markdownContent).toBeDefined();
      expect(markdownContent.content).toBe(
        sampleMarkdownCourse.content[1].content
      );
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/courses/${nonExistentId}`);

      expect(res.status).toBe(404);
    });
  });
});
