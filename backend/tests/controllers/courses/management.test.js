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

describe('Course Management Endpoints', () => {
  let instructorToken;
  let adminToken;
  let studentToken;
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
  });

  const sampleCourse = {
    title: 'Test Course',
    description: 'This is a test course',
    price: 99.99,
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

  const sampleMultipleChoiceCourse = {
    title: 'Multiple Choice Quiz Course',
    description: 'Course with multiple choice quizzes',
    price: 89.99,
    duration: 12,
    content: [
      {
        title: 'Introduction',
        videoUrl: 'https://example.com/video1',
        type: 'video',
      },
      {
        title: 'Multiple Choice Quiz',
        type: 'multipleChoice',
        question: 'Which planet is closest to the sun?',
        options: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correctOption: 0,
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
      expect(res.body.course).toHaveProperty('status', 'draft');
      expect(res.body.message).toContain('draft mode');
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

    it('should deny access to students', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(sampleCourse);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('POST /api/courses - Multiple Choice Quiz', () => {
    it('should create a course with multiple choice quiz content', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(sampleMultipleChoiceCourse);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('courseId');

      // Check multiple choice quiz content
      const quizContent = res.body.course.content.find(
        (c) => c.type === 'multipleChoice'
      );
      expect(quizContent).toBeDefined();
      expect(quizContent.question).toBe('Which planet is closest to the sun?');
      expect(quizContent.options).toHaveLength(4);
      expect(quizContent.options[0]).toBe('Mercury');
      expect(quizContent.correctOption).toBe(0);
    });

    it('should reject multiple choice quiz with fewer than 4 options', async () => {
      const invalidQuizCourse = {
        ...sampleMultipleChoiceCourse,
        content: [
          {
            title: 'Invalid Quiz',
            type: 'multipleChoice',
            question: 'Which planet is closest to the sun?',
            options: ['Mercury', 'Venus', 'Earth'], // Only 3 options
            correctOption: 0,
          },
        ],
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidQuizCourse);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Multiple choice questions must include'
      );
    });

    it('should reject multiple choice quiz with invalid correctOption', async () => {
      const invalidOptionCourse = {
        ...sampleMultipleChoiceCourse,
        content: [
          {
            title: 'Invalid Quiz',
            type: 'multipleChoice',
            question: 'Which planet is closest to the sun?',
            options: ['Mercury', 'Venus', 'Earth', 'Mars'],
            correctOption: 4, // Out of range (should be 0-3)
          },
        ],
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidOptionCourse);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Multiple choice questions must include'
      );
    });

    it('should reject multiple choice quiz without a question', async () => {
      const missingQuestionCourse = {
        ...sampleMultipleChoiceCourse,
        content: [
          {
            title: 'Invalid Quiz',
            type: 'multipleChoice',
            // Missing question field
            options: ['Mercury', 'Venus', 'Earth', 'Mars'],
            correctOption: 0,
          },
        ],
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(missingQuestionCourse);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Multiple choice questions must include'
      );
    });
  });

  describe('PATCH /api/courses/:id/publish', () => {
    let courseIdWithContent;
    let courseIdWithoutContent;

    beforeEach(async () => {
      // Create a test course with content
      const courseWithContent = await Course.create({
        ...sampleCourse,
        instructor: instructorUser.fullName,
      });
      courseIdWithContent = courseWithContent._id;

      // Create a test course without content
      const courseWithoutContent = await Course.create({
        title: 'Course Without Content',
        description: 'This course has no content items',
        price: 49.99,
        instructor: instructorUser.fullName,
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

    it('should not allow publishing a course without content', async () => {
      const course = await Course.create({
        title: 'Test Course No Content',
        description: 'A course for testing publish without content',
        price: 10,
        duration: 1,
        instructor: instructorUser.fullName, // Corrected to use instructor's fullName
        // No content added
      });

      const res = await request(app)
        .patch(`/api/courses/${course.id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Course must have content to be published');
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

  describe('PUT /api/courses/:id', () => {
    let courseId;
    let courseCreatedByInstructor;

    beforeEach(async () => {
      // Create a test course
      const course = await Course.create({
        title: 'Original Course Title',
        description: 'Original description',
        markdownDescription: '# Original Markdown',
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
      courseCreatedByInstructor = course;
    });

    it('should update course details as instructor', async () => {
      const updateData = {
        title: 'Updated Course Title',
        description: 'Updated description',
        price: 129.99,
      };

      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('updated successfully');
      expect(res.body.course).toHaveProperty('title', updateData.title);
      expect(res.body.course).toHaveProperty(
        'description',
        updateData.description
      );
      expect(res.body.course).toHaveProperty('price', updateData.price);

      // Original fields should remain unchanged
      expect(res.body.course).toHaveProperty(
        'instructor',
        instructorUser.fullName
      );
      expect(res.body.course).toHaveProperty('duration', 10);

      // Verify database update
      const updatedCourse = await Course.findById(courseId);
      expect(updatedCourse.title).toBe(updateData.title);
    });

    it('should update markdown description', async () => {
      const updateData = {
        markdownDescription: '# Updated Markdown\n\nWith more content',
      };

      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.course).toHaveProperty(
        'markdownDescription',
        updateData.markdownDescription
      );
    });

    it('should reject invalid markdown description', async () => {
      const updateData = {
        markdownDescription: 123, // Should be a string
      };

      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updateData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Markdown description must be a string'
      );
    });

    it('should allow admin to update any course', async () => {
      const updateData = {
        title: 'Admin Updated Title',
        price: 149.99,
      };

      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('updated successfully');
      expect(res.body.course).toHaveProperty('title', updateData.title);
      expect(res.body.course).toHaveProperty('price', updateData.price);

      // Should not change instructor
      expect(res.body.course).toHaveProperty(
        'instructor',
        instructorUser.fullName
      );
    });

    it('should deny access to non-instructor users', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Student Update Attempt' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/courses/${nonExistentId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'Update Attempt' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });
});
