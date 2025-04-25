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
      expect(res.body).toHaveProperty('courseId');
      expect(res.body.course).toHaveProperty('title', sampleCourse.title);
      expect(res.body.course).toHaveProperty(
        'description',
        sampleCourse.description
      );
      expect(res.body.course).toHaveProperty('status', 'draft'); // Check for default draft status
      expect(res.body.message).toContain('draft mode'); // Verify message about draft mode
    });

    it('should create a course with markdown description and content as admin', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleMarkdownCourse);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('courseId');
      expect(res.body.course).toHaveProperty(
        'markdownDescription',
        sampleMarkdownCourse.markdownDescription
      );
      expect(res.body.course.content).toHaveLength(3);

      // Check markdown content
      const markdownContent = res.body.course.content.find(
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

  // New tests for course content update functionality
  describe('PUT /api/courses/:id/content', () => {
    let courseId;

    beforeEach(async () => {
      // Create a test course to update
      const course = await Course.create(sampleCourse);
      courseId = course._id;
    });

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

  // New tests for course publishing functionality
  describe('PATCH /api/courses/:id/publish', () => {
    let courseIdWithContent;
    let courseIdWithoutContent;

    beforeEach(async () => {
      // Create a test course with content
      const courseWithContent = await Course.create(sampleCourse);
      courseIdWithContent = courseWithContent._id;

      // Create a test course without content
      const courseWithoutContent = await Course.create({
        title: 'Course Without Content',
        description: 'This course has no content items',
        price: 49.99,
        instructor: 'Test Instructor',
        duration: 5,
        content: [],
      });
      courseIdWithoutContent = courseWithoutContent._id;
    });

    it('should publish a course with content successfully as instructor', async () => {
      const res = await request(app)
        .patch(`/api/courses/${courseIdWithContent}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('published successfully');

      // Verify the course was updated in the database
      const updatedCourse = await Course.findById(courseIdWithContent);
      expect(updatedCourse.status).toBe('published');
    });

    it('should publish a course with content successfully as admin', async () => {
      const res = await request(app)
        .patch(`/api/courses/${courseIdWithContent}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('published successfully');
    });

    it('should not allow publishing a course without content', async () => {
      const res = await request(app)
        .patch(`/api/courses/${courseIdWithoutContent}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('no content');

      // Verify the course status wasn't changed
      const course = await Course.findById(courseIdWithoutContent);
      expect(course.status).toBe('draft');
    });

    it('should return 404 when publishing non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/courses/${nonExistentId}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('should deny access to students', async () => {
      const res = await request(app)
        .patch(`/api/courses/${courseIdWithContent}/publish`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });
});
