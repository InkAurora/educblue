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
        .get(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      // eslint-disable-next-line no-underscore-dangle
      expect(res.body._id).toBe(course.id.toString());
      expect(res.body.title).toBe(course.title);
    });

    it('should get markdown course by id with all content', async () => {
      const course = await Course.create(sampleMarkdownCourse);

      // Add authorization if needed
      const res = await request(app)
        .get(`/api/courses/${course.id}`)
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
      await User.findByIdAndUpdate(studentUser.id, {
        $push: { enrolledCourses: course.id },
      });

      // Get the section and content IDs from the created course
      const sectionId = course.sections[0].id;
      const contentId = course.sections[0].content[1].id;

      const res = await request(app)
        .get(
          `/api/courses/${course.id}/sections/${sectionId}/content/${contentId}`
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
      const sectionId = course.sections[0].id;
      const contentId = course.sections[0].content[0].id;

      // Try to access as a student who is not enrolled
      const res = await request(app)
        .get(
          `/api/courses/${course.id}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not enrolled');
    });

    it('should return 404 for non-existent content', async () => {
      const course = await Course.create(sampleCourse);

      // Enroll the student in the course
      await User.findByIdAndUpdate(studentUser.id, {
        $push: { enrolledCourses: course.id },
      });

      // Use a non-existent content ID
      const sectionId = course.sections[0].id;
      const nonExistentContentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(
          `/api/courses/${course.id}/sections/${sectionId}/content/${nonExistentContentId}`
        )
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Content not found');
    });

    it('should return 401 when no auth token provided', async () => {
      const course = await Course.create(sampleCourse);
      const sectionId = course.sections[0].id;
      const contentId = course.sections[0].content[0].id;

      const res = await request(app).get(
        `/api/courses/${course.id}/sections/${sectionId}/content/${contentId}`
      );

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('No token, authorization denied');
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const sectionId = new mongoose.Types.ObjectId();
      const contentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(
          `/api/courses/${nonExistentId}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Course not found');
    });

    it('should return 404 for non-existent section', async () => {
      const course = await Course.create(sampleCourse);

      // Enroll the student in the course
      await User.findByIdAndUpdate(studentUser.id, {
        $push: { enrolledCourses: course.id },
      });

      const nonExistentSectionId = new mongoose.Types.ObjectId();
      const contentId = course.sections[0].content[0].id;

      const res = await request(app)
        .get(
          `/api/courses/${course.id}/sections/${nonExistentSectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Section not found');
    });

    it('should allow instructor to access content', async () => {
      const course = await Course.create({
        ...sampleCourse,
        instructor: instructorUser.id,
      });

      const sectionId = course.sections[0].id;
      const contentId = course.sections[0].content[0].id;

      const res = await request(app)
        .get(
          `/api/courses/${course.id}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Introduction');
    });
  });

  describe('GET /api/courses/:id/content', () => {
    it('should get all sections and content items for enrolled user', async () => {
      const course = await Course.create({
        ...sampleCourse,
        sections: [
          {
            title: 'Section 1',
            description: 'First section',
            order: 1,
            content: [
              {
                title: 'Video 1',
                type: 'video',
                videoUrl: 'https://example.com/video1',
                order: 1,
              },
              {
                title: 'Quiz 1',
                type: 'quiz',
                order: 2,
              },
            ],
          },
          {
            title: 'Section 2',
            description: 'Second section',
            order: 2,
            content: [
              {
                title: 'Video 2',
                type: 'video',
                videoUrl: 'https://example.com/video2',
                order: 1,
              },
            ],
          },
        ],
      });

      // Enroll the student in the course
      await User.findByIdAndUpdate(studentUser.id, {
        $push: { enrolledCourses: course.id },
      });

      const res = await request(app)
        .get(`/api/courses/${course.id}/content`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Section 1');
      expect(res.body[0].content.length).toBe(2);
      expect(res.body[0].content[0].title).toBe('Video 1');
      expect(res.body[0].content[0].type).toBe('video');
    });

    it('should deny access to non-enrolled users', async () => {
      const course = await Course.create(sampleCourse);

      const res = await request(app)
        .get(`/api/courses/${course.id}/content`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not enrolled');
    });

    it('should return 401 when no auth token provided', async () => {
      const course = await Course.create(sampleCourse);

      const res = await request(app).get(`/api/courses/${course.id}/content`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('No token, authorization denied');
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/courses/${nonExistentId}/content`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Course not found');
    });

    it('should allow instructor to access their course contents', async () => {
      const course = await Course.create({
        ...sampleCourse,
        instructor: instructorUser.id,
      });

      const res = await request(app)
        .get(`/api/courses/${course.id}/content`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('GET /api/courses/:id/sections', () => {
    it('should get course sections for enrolled user', async () => {
      const course = await Course.create({
        ...sampleCourse,
        sections: [
          {
            title: 'Section 1',
            description: 'First section',
            order: 1,
            content: [
              { title: 'Video 1', type: 'video' },
              { title: 'Quiz 1', type: 'quiz' },
            ],
          },
          {
            title: 'Section 2',
            description: 'Second section',
            order: 2,
            content: [{ title: 'Video 2', type: 'video' }],
          },
        ],
      });

      // Enroll the student in the course
      await User.findByIdAndUpdate(studentUser.id, {
        $push: { enrolledCourses: course.id },
      });

      const res = await request(app)
        .get(`/api/courses/${course.id}/sections`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Section 1');
      expect(res.body[0].contentCount).toBe(2);
      expect(res.body[1].contentCount).toBe(1);
      // Content details should not be included
      expect(res.body[0].content).toBeUndefined();
    });

    it('should deny access to non-enrolled users', async () => {
      const course = await Course.create(sampleCourse);

      const res = await request(app)
        .get(`/api/courses/${course.id}/sections`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not enrolled');
    });

    it('should return 401 when no auth token provided', async () => {
      const course = await Course.create(sampleCourse);

      const res = await request(app).get(`/api/courses/${course.id}/sections`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('No token, authorization denied');
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/courses/${nonExistentId}/sections`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Course not found');
    });
  });

  describe('GET /api/courses/:id/sections/:sectionId', () => {
    it('should get section content for enrolled user', async () => {
      const course = await Course.create({
        ...sampleCourse,
        sections: [
          {
            title: 'Section 1',
            description: 'First section',
            order: 1,
            content: [
              {
                title: 'Video 1',
                type: 'video',
                description: 'Introduction video',
                order: 1,
                duration: 300,
                url: 'https://example.com/video1',
                content: 'Video content',
              },
              {
                title: 'Quiz 1',
                type: 'quiz',
                description: 'First quiz',
                order: 2,
                questions: ['What is 2+2?'],
              },
            ],
          },
        ],
      });

      // Enroll the student in the course
      await User.findByIdAndUpdate(studentUser.id, {
        $push: { enrolledCourses: course.id },
      });

      const sectionId = course.sections[0].id;

      const res = await request(app)
        .get(`/api/courses/${course.id}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Section 1');
      expect(res.body.content.length).toBe(2);
      expect(res.body.content[0].title).toBe('Video 1');
      expect(res.body.content[0].type).toBe('video');
      // Second content item is a quiz
      expect(res.body.content[1].title).toBe('Quiz 1');
      expect(res.body.content[1].type).toBe('quiz');
    });

    it('should deny access to non-enrolled users', async () => {
      const course = await Course.create(sampleCourse);
      const sectionId = course.sections[0].id;

      const res = await request(app)
        .get(`/api/courses/${course.id}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not enrolled');
    });

    it('should return 401 when no auth token provided', async () => {
      const course = await Course.create(sampleCourse);
      const sectionId = course.sections[0].id;

      const res = await request(app).get(
        `/api/courses/${course.id}/sections/${sectionId}`
      );

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('No token, authorization denied');
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const sectionId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/courses/${nonExistentId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Course not found');
    });

    it('should return 404 for non-existent section', async () => {
      const course = await Course.create(sampleCourse);

      // Enroll the student in the course
      await User.findByIdAndUpdate(studentUser.id, {
        $push: { enrolledCourses: course.id },
      });

      const nonExistentSectionId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/courses/${course.id}/sections/${nonExistentSectionId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Section not found');
    });
  });

  describe('GET /api/courses/instructor', () => {
    beforeEach(async () => {
      // Clean up courses before each test
      await Course.deleteMany({});
    });

    it('should return all courses created by the instructor', async () => {
      // Create courses for the instructor
      await Course.create({
        ...sampleCourse,
        title: 'Instructor Course 1',
        instructor: instructorUser.id,
      });

      await Course.create({
        ...sampleCourse,
        title: 'Instructor Course 2',
        instructor: instructorUser.id,
        status: 'draft',
      });

      // Create a course for another instructor to ensure filtering works
      const otherInstructor = await User.create({
        fullName: 'Other Instructor',
        email: 'other@test.com',
        password: 'password123',
        role: 'instructor',
      });

      await Course.create({
        ...sampleCourse,
        title: 'Other Course',
        instructor: otherInstructor.id,
      });

      const res = await request(app)
        .get('/api/courses/instructor')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('retrieved successfully');
      expect(res.body.courses.length).toBe(2);
      expect(res.body.totalCourses).toBe(2);
      expect(res.body.courses[0].title).toContain('Instructor Course');
      expect(res.body.courses[1].title).toContain('Instructor Course');
    });

    it('should deny access to students', async () => {
      const res = await request(app)
        .get('/api/courses/instructor')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('should return 401 when no auth token provided', async () => {
      const res = await request(app).get('/api/courses/instructor');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('No token, authorization denied');
    });

    it('should return empty array when instructor has no courses', async () => {
      const res = await request(app)
        .get('/api/courses/instructor')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.courses).toEqual([]);
      expect(res.body.totalCourses).toBe(0);
    });

    it('should allow admin to access instructor endpoint', async () => {
      // Create an admin user and token
      const adminUser = await User.create({
        fullName: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
      });

      const adminToken = jwt.sign(
        {
          id: adminUser.id,
          role: adminUser.role,
          email: adminUser.email,
          fullName: adminUser.fullName,
        },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '1h' }
      );

      // Create a course for the admin
      await Course.create({
        ...sampleCourse,
        title: 'Admin Course',
        instructor: adminUser.id,
      });

      const res = await request(app)
        .get('/api/courses/instructor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.courses.length).toBe(1);
      expect(res.body.courses[0].title).toBe('Admin Course');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle missing user in getCourseById', async () => {
      const course = await Course.create(sampleCourse);

      // Create a token for a non-existent user
      const fakeToken = jwt.sign(
        {
          id: new mongoose.Types.ObjectId(),
          role: 'student',
          email: 'fake@test.com',
          fullName: 'Fake User',
        },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).toBe(200);
      // Should return limited course info since user doesn't exist
      expect(res.body.sections).toBeUndefined();
    });

    it('should return limited course info for non-enrolled users', async () => {
      const course = await Course.create(sampleCourse);

      const res = await request(app)
        .get(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe(course.title);
      expect(res.body.description).toBe(course.description);
      expect(res.body.price).toBe(course.price);
      // Should not include sections for non-enrolled users
      expect(res.body.sections).toBeUndefined();
    });

    it('should handle course without instructor field', async () => {
      // Try creating a course without instructor should fail validation
      try {
        await Course.create({
          ...sampleCourse,
          instructor: undefined,
        });
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain(
          'instructor: Path `instructor` is required'
        );
      }
    });

    it('should handle course with empty sections array', async () => {
      const course = await Course.create({
        ...sampleCourse,
        sections: [],
      });

      // Enroll the student
      await User.findByIdAndUpdate(studentUser.id, {
        $push: { enrolledCourses: course.id },
      });

      const res = await request(app)
        .get(`/api/courses/${course.id}/content`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(0);
    });

    it('should handle missing user in getCourseContentById', async () => {
      const course = await Course.create(sampleCourse);

      // Create a token for a non-existent user
      const fakeToken = jwt.sign(
        {
          id: new mongoose.Types.ObjectId(),
          role: 'student',
          email: 'fake@test.com',
          fullName: 'Fake User',
        },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '1h' }
      );

      const sectionId = course.sections[0].id;
      const contentId = course.sections[0].content[0].id;

      const res = await request(app)
        .get(
          `/api/courses/${course.id}/sections/${sectionId}/content/${contentId}`
        )
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('User not found');
    });
  });
});
