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
  let sectionCourseId;

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

    // Create a test course with sections for section-based tests
    const sectionCourse = await Course.create({
      title: 'Section Course',
      description: 'This is a course with sections',
      price: 99.99,
      instructor: instructorUser._id,
      duration: 10,
      sections: [
        {
          title: 'Chapter 1',
          order: 1,
          content: [
            {
              title: 'Video 1',
              videoUrl: 'https://example.com/video1',
              type: 'video',
            },
          ],
        },
      ],
    });
    sectionCourseId = sectionCourse._id;
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

  describe('PUT /api/courses/:id/sections', () => {
    it('should update course sections successfully as instructor', async () => {
      const updatedSections = [
        {
          title: 'Updated Chapter 1',
          order: 1,
          content: [
            {
              title: 'Updated Video 1',
              videoUrl: 'https://example.com/updated-video1',
              type: 'video',
            },
          ],
        },
        {
          title: 'New Chapter 2',
          order: 2,
          content: [
            {
              title: 'Video 2',
              videoUrl: 'https://example.com/video2',
              type: 'video',
            },
          ],
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${sectionCourseId}/sections`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ sections: updatedSections });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Course sections updated successfully');
      expect(res.body.course.sections).toHaveLength(2);
      expect(res.body.course.sections[0].title).toBe('Updated Chapter 1');
      expect(res.body.course.sections[1].title).toBe('New Chapter 2');
    });

    it('should add a new section successfully', async () => {
      const sectionData = {
        title: 'New Section',
        description: 'A new section for testing',
        order: 2,
        content: [],
      };

      const res = await request(app)
        .post(`/api/courses/${sectionCourseId}/sections`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(sectionData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Section added successfully');
      expect(res.body.course.sections).toHaveLength(2);
      expect(res.body.newSectionId).toBeDefined();
    });

    it('should delete a section successfully', async () => {
      // Delete the existing section (first section from our setup)
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const deleteRes = await request(app)
        .delete(`/api/courses/${sectionCourseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toBe('Section deleted successfully');
    });
  });

  describe('POST /api/courses/:id/sections/:sectionId/content', () => {
    it('should add content to a section successfully as instructor', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const newContent = {
        title: 'New Video Content',
        videoUrl: 'https://example.com/new-video',
        type: 'video',
      };

      const res = await request(app)
        .post(`/api/courses/${sectionCourseId}/sections/${sectionId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(newContent);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Content added successfully');
      expect(res.body.content).toBeDefined();
      expect(res.body.content.title).toBe('New Video Content');
    });

    it('should add markdown content to a section successfully', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const newContent = {
        title: 'New Markdown Content',
        type: 'markdown',
        content: '# New Content\n\nThis is markdown content.',
      };

      const res = await request(app)
        .post(`/api/courses/${sectionCourseId}/sections/${sectionId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(newContent);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Content added successfully');
      expect(res.body.content).toBeDefined();
    });

    it('should add multiple choice quiz content to a section successfully', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const newContent = {
        title: 'Quiz Question',
        type: 'multipleChoice',
        question: 'What is 2 + 2?',
        options: ['2', '3', '4', '5'],
        correctOption: 2,
      };

      const res = await request(app)
        .post(`/api/courses/${sectionCourseId}/sections/${sectionId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(newContent);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Content added successfully');
      expect(res.body.content).toBeDefined();
    });

    it('should validate content type when adding content', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const invalidContent = {
        title: 'Invalid Content',
        type: 'invalid_type',
      };

      const res = await request(app)
        .post(`/api/courses/${sectionCourseId}/sections/${sectionId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidContent);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Content items must have a valid type'
      );
    });

    it('should validate required fields for multiple choice quiz', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const invalidQuiz = {
        title: 'Quiz Question',
        type: 'multipleChoice',
        question: 'What is 2 + 2?',
        options: ['2', '3'], // Too few options
        correctOption: 2,
      };

      const res = await request(app)
        .post(`/api/courses/${sectionCourseId}/sections/${sectionId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidQuiz);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Multiple choice questions must include'
      );
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentCourseId = new mongoose.Types.ObjectId();
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const newContent = {
        title: 'New Content',
        type: 'video',
        videoUrl: 'https://example.com/video',
      };

      const res = await request(app)
        .post(
          `/api/courses/${nonExistentCourseId}/sections/${sectionId}/content`
        )
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(newContent);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Course not found');
    });

    it('should return 404 for non-existent section', async () => {
      const nonExistentSectionId = new mongoose.Types.ObjectId();

      const newContent = {
        title: 'New Content',
        type: 'video',
        videoUrl: 'https://example.com/video',
      };

      const res = await request(app)
        .post(
          `/api/courses/${sectionCourseId}/sections/${nonExistentSectionId}/content`
        )
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(newContent);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Section not found');
    });

    it('should deny access to students', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const newContent = {
        title: 'New Content',
        type: 'video',
        videoUrl: 'https://example.com/video',
      };

      const res = await request(app)
        .post(`/api/courses/${sectionCourseId}/sections/${sectionId}/content`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newContent);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/courses/:id/sections/:sectionId/content/:contentId', () => {
    it('should update content in a section successfully as instructor', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      const updatedContent = {
        title: 'Updated Video Title',
        videoUrl: 'https://example.com/updated-video',
        type: 'video',
      };

      const res = await request(app)
        .put(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updatedContent);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Content updated successfully');
      expect(res.body.content.title).toBe('Updated Video Title');
    });

    it('should update content to markdown type successfully', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      const updatedContent = {
        title: 'Updated to Markdown',
        type: 'markdown',
        content: '# Updated Content\n\nThis is now markdown.',
      };

      const res = await request(app)
        .put(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updatedContent);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Content updated successfully');
      expect(res.body.content.type).toBe('markdown');
    });

    it('should update content to multiple choice quiz successfully', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      const updatedContent = {
        title: 'Updated Quiz',
        type: 'multipleChoice',
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctOption: 2,
      };

      const res = await request(app)
        .put(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updatedContent);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Content updated successfully');
      expect(res.body.content.type).toBe('multipleChoice');
    });

    it('should validate content type when updating', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      const invalidContent = {
        title: 'Invalid Update',
        type: 'invalid_type',
      };

      const res = await request(app)
        .put(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidContent);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Content items must have a valid type'
      );
    });

    it('should return 404 for non-existent content', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const nonExistentContentId = new mongoose.Types.ObjectId();

      const updatedContent = {
        title: 'Updated Content',
        type: 'video',
        videoUrl: 'https://example.com/video',
      };

      const res = await request(app)
        .put(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${nonExistentContentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updatedContent);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Content not found');
    });

    it('should deny access to students', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      const updatedContent = {
        title: 'Updated Content',
        type: 'video',
        videoUrl: 'https://example.com/video',
      };

      const res = await request(app)
        .put(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updatedContent);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('DELETE /api/courses/:id/sections/:sectionId/content/:contentId', () => {
    it('should delete content from a section successfully as instructor', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      const res = await request(app)
        .delete(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Content deleted successfully');
    });

    it('should allow admin to delete content from any course', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      const res = await request(app)
        .delete(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Content deleted successfully');
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentCourseId = new mongoose.Types.ObjectId();
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      const res = await request(app)
        .delete(
          `/api/courses/${nonExistentCourseId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Course not found');
    });

    it('should return 404 for non-existent section', async () => {
      const nonExistentSectionId = new mongoose.Types.ObjectId();
      const course = await Course.findById(sectionCourseId);
      const contentId = course.sections[0].content[0]._id;

      const res = await request(app)
        .delete(
          `/api/courses/${sectionCourseId}/sections/${nonExistentSectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Section not found');
    });

    it('should return 404 for non-existent content', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const nonExistentContentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${nonExistentContentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Content not found');
    });

    it('should deny access to students', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      const res = await request(app)
        .delete(
          `/api/courses/${sectionCourseId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/courses/:id/sections/:sectionId', () => {
    it('should update section details successfully as instructor', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const updatedSection = {
        title: 'Updated Chapter Title',
        description: 'This is an updated description',
        order: 2,
      };

      const res = await request(app)
        .put(`/api/courses/${sectionCourseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updatedSection);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Section updated successfully');
      expect(res.body.section.title).toBe('Updated Chapter Title');
      expect(res.body.section.description).toBe(
        'This is an updated description'
      );
      expect(res.body.section.order).toBe(2);
    });

    it('should update only provided fields', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;
      const originalTitle = course.sections[0].title;

      const partialUpdate = {
        title: originalTitle, // Must include title as it's required
        description: 'Only updating description',
      };

      const res = await request(app)
        .put(`/api/courses/${sectionCourseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(partialUpdate);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Section updated successfully');
      expect(res.body.section.title).toBe(originalTitle); // Should remain unchanged
      expect(res.body.section.description).toBe('Only updating description');
    });

    it('should allow admin to update sections in any course', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const updatedSection = {
        title: 'Admin Updated Title',
        order: 3,
      };

      const res = await request(app)
        .put(`/api/courses/${sectionCourseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedSection);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Section updated successfully');
      expect(res.body.section.title).toBe('Admin Updated Title');
    });

    it('should validate section title is required', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const invalidUpdate = {
        title: '', // Empty title
        description: 'Valid description',
      };

      const res = await request(app)
        .put(`/api/courses/${sectionCourseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidUpdate);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Section title is required');
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentCourseId = new mongoose.Types.ObjectId();
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const updatedSection = {
        title: 'Updated Title',
      };

      const res = await request(app)
        .put(`/api/courses/${nonExistentCourseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updatedSection);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Course not found');
    });

    it('should return 404 for non-existent section', async () => {
      const nonExistentSectionId = new mongoose.Types.ObjectId();

      const updatedSection = {
        title: 'Updated Title',
      };

      const res = await request(app)
        .put(`/api/courses/${sectionCourseId}/sections/${nonExistentSectionId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updatedSection);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Section not found');
    });

    it('should deny access to students', async () => {
      const course = await Course.findById(sectionCourseId);
      const sectionId = course.sections[0]._id;

      const updatedSection = {
        title: 'Student Update Attempt',
      };

      const res = await request(app)
        .put(`/api/courses/${sectionCourseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updatedSection);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });
});
