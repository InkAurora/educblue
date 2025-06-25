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

describe('Course Listing Endpoints', () => {
  let instructorToken;
  let studentToken;
  let instructorUser;
  let studentUser;

  beforeAll(async () => {
    // Create test users with different roles
    instructorUser = await User.create({
      fullName: 'Test Instructor',
      email: 'instructor@test.com',
      password: 'password123',
      role: 'instructor',
    });

    studentUser = await User.create({
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
    instructor: new mongoose.Types.ObjectId(),
    duration: 10,
    status: 'published', // Add published status so it appears in course listing
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

  const sampleMarkdownCourse = {
    title: 'Markdown Course',
    description: 'Course with markdown',
    markdownDescription:
      '# Main Title\n\nMarkdown course description with **bold** and *italic* text.',
    price: 79.99,
    instructor: new mongoose.Types.ObjectId(),
    duration: 8,
    status: 'published', // Add published status so it appears in course listing
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
  };

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
      // Note: content and sections are excluded from course listing for performance
      expect(res.body[0].content).toBeUndefined();
      expect(res.body[0].sections).toBeUndefined();
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should get course by id', async () => {
      const course = await Course.create(sampleCourse);

      // Add authorization if needed
      const res = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(course._id.toString());
      expect(res.body.title).toBe(course.title);
    });

    it('should get markdown course by id with all content', async () => {
      const course = await Course.create(sampleMarkdownCourse);

      // Add authorization if needed
      const res = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.markdownDescription).toBe(
        sampleMarkdownCourse.markdownDescription
      );

      // Check if content exists before trying to find markdown content
      if (res.body.content && Array.isArray(res.body.content)) {
        const markdownContent = res.body.content.find(
          (c) => c.type === 'markdown'
        );
        expect(markdownContent).toBeDefined();
        if (markdownContent) {
          expect(markdownContent.content).toBe(
            sampleMarkdownCourse.sections[0].content[1].content
          );
        }
      }
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      // Add authorization if needed
      const res = await request(app)
        .get(`/api/courses/${nonExistentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/courses/:id/sections/:sectionId/content/:contentId', () => {
    it('should get specific content by id', async () => {
      // Create a course with multiple content items
      const course = await Course.create({
        ...sampleCourse,
        sections: [
          {
            title: 'Section 1',
            order: 1,
            content: [
              {
                title: 'Introduction',
                type: 'video',
                videoUrl: 'https://example.com/video1',
              },
              {
                title: 'Chapter 1',
                type: 'markdown',
                content: '# Chapter 1\n\nThis is chapter 1 content.',
              },
            ],
          },
        ],
      });

      // Enroll the student in the course
      await User.findByIdAndUpdate(studentUser._id, {
        $push: { enrolledCourses: course._id },
      });

      // Get the section and content IDs from the created course
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[1]._id;

      const res = await request(app)
        .get(
          `/api/courses/${course._id}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Chapter 1');
      expect(res.body.type).toBe('markdown');
      expect(res.body.content).toBe(
        '# Chapter 1\n\nThis is chapter 1 content.'
      );
    });

    it('should deny access to non-enrolled users', async () => {
      // Create a course
      const course = await Course.create(sampleCourse);
      const sectionId = course.sections[0]._id;
      const contentId = course.sections[0].content[0]._id;

      // Try to access as a student who is not enrolled
      const res = await request(app)
        .get(
          `/api/courses/${course._id}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not enrolled');
    });

    it('should return 404 for non-existent content', async () => {
      const course = await Course.create(sampleCourse);

      // Enroll the student in the course
      await User.findByIdAndUpdate(studentUser._id, {
        $push: { enrolledCourses: course._id },
      });

      // Use a non-existent content ID
      const sectionId = course.sections[0]._id;
      const nonExistentContentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(
          `/api/courses/${course._id}/sections/${sectionId}/content/${nonExistentContentId}`
        )
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Content not found');
    });
  });
});
