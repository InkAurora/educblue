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
  let instructorUser; // Added to store instructor user object
  let studentUser; // Added to store student user object

  beforeAll(async () => {
    // Create test users with different roles
    // instructorUser is assigned here
    instructorUser = await User.create({
      fullName: 'Test Instructor',
      email: 'instructor@test.com',
      password: 'password123',
      role: 'instructor',
      isVerified: true, // Ensure user is verified for login
    });

    const adminUser = await User.create({
      fullName: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      isVerified: true, // Ensure user is verified for login
    });

    studentUser = await User.create({
      fullName: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      isVerified: true, // Ensure user is verified for login
    });

    // Generate tokens
    instructorToken = jwt.sign(
      {
        id: instructorUser.id, // Use .id
        role: instructorUser.role,
        email: instructorUser.email,
        fullName: instructorUser.fullName,
      },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      {
        id: adminUser.id, // Use .id
        role: adminUser.role,
        email: adminUser.email,
        fullName: adminUser.fullName,
      },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      {
        id: studentUser.id, // Use .id
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
    sections: [
      {
        title: 'Section 1',
        description: 'First section',
        order: 1,
        content: [
          {
            title: 'Introduction',
            type: 'video',
            url: 'https://example.com/video1',
            order: 1,
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
    duration: 8,
    sections: [
      {
        title: 'Section 1',
        description: 'Introduction section',
        order: 1,
        content: [
          {
            title: 'Introduction',
            type: 'video',
            url: 'https://example.com/video1',
            order: 1,
          },
          {
            title: 'Markdown Lesson',
            type: 'markdown',
            content:
              '# Lesson 1\n\nThis is a markdown lesson with code:\n```javascript\nconst x = 1;\n```',
            order: 2,
          },
          {
            title: 'Quiz',
            type: 'quiz',
            order: 3,
          },
        ],
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
      expect(res.body.course.sections).toHaveLength(1);
      expect(res.body.course.sections[0].content).toHaveLength(3);

      // Check markdown content within sections
      const markdownContent = res.body.course.sections[0].content.find(
        (c) => c.type === 'markdown'
      );
      expect(markdownContent).toBeDefined();
      expect(markdownContent.content).toBe(
        sampleMarkdownCourse.sections[0].content[1].content
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
        sections: [
          {
            title: 'Test Section',
            description: 'Test section description',
            order: 1,
            content: [
              {
                title: 'Invalid Content',
                type: 'invalid_type', // Invalid content type
                order: 1,
              },
            ],
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
        sections: [
          {
            title: 'Test Section',
            description: 'Test section description',
            order: 1,
            content: [
              {
                title: 'Invalid Markdown',
                type: 'markdown',
                order: 1,
                // Missing content field
              },
            ],
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
      await Course.create({
        ...sampleCourse,
        instructor: instructorUser._id, // Use ObjectId
        status: 'published',
      });
      await Course.create({
        ...sampleCourse,
        title: 'Another Course',
        instructor: instructorUser._id, // Use ObjectId
        status: 'published',
      });

      const res = await request(app).get('/api/courses');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
    });

    it('should include markdown description but not sections/content in course list', async () => {
      await Course.create({
        ...sampleMarkdownCourse,
        instructor: instructorUser._id, // Use ObjectId
        status: 'published',
      });

      const res = await request(app).get('/api/courses');

      expect(res.status).toBe(200);
      expect(res.body[0].markdownDescription).toBe(
        sampleMarkdownCourse.markdownDescription
      );
      // Content should not be exposed in public course listing
      expect(res.body[0].content).toBeUndefined();
      expect(res.body[0].sections).toBeUndefined();
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should get course by id', async () => {
      const course = await Course.create({
        ...sampleCourse,
        instructor: instructorUser._id, // Use ObjectId
        status: 'published',
      });

      // Test without enrollment - should return limited info
      const res = await request(app).get(`/api/courses/${course.id}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(course.id.toString());
      expect(res.body.title).toBe(course.title);
      expect(res.body.description).toBe(course.description);
      expect(res.body.price).toBe(course.price);
      // Should not include sections/content for non-enrolled users
      expect(res.body.sections).toBeUndefined();
      expect(res.body.content).toBeUndefined();
    });

    it('should get markdown course by id with limited info for non-enrolled users', async () => {
      const course = await Course.create({
        ...sampleMarkdownCourse,
        instructor: instructorUser._id, // Use ObjectId
        status: 'published',
      });

      // Test without enrollment - should return limited info
      const res = await request(app).get(`/api/courses/${course.id}`);

      expect(res.status).toBe(200);
      expect(res.body.markdownDescription).toBe(
        sampleMarkdownCourse.markdownDescription
      );
      expect(res.body._id).toBe(course.id.toString());

      // Should not include sections/content for non-enrolled users
      expect(res.body.sections).toBeUndefined();
      expect(res.body.content).toBeUndefined();
    });

    it('should get full course details for enrolled users', async () => {
      const course = await Course.create({
        ...sampleMarkdownCourse,
        instructor: instructorUser._id, // Use ObjectId
        status: 'published',
      });

      // Enroll the student in the course
      await User.findByIdAndUpdate(studentUser._id, {
        $push: { enrolledCourses: course._id },
      });

      // Test with enrollment - should return full course details
      const res = await request(app)
        .get(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.markdownDescription).toBe(
        sampleMarkdownCourse.markdownDescription
      );
      expect(res.body._id).toBe(course.id.toString());

      // Should include sections for enrolled users
      expect(res.body.sections).toBeDefined();
      expect(Array.isArray(res.body.sections)).toBe(true);
      expect(res.body.sections.length).toBe(1);

      // Check section content structure
      const section = res.body.sections[0];
      expect(section.content).toBeDefined();
      expect(Array.isArray(section.content)).toBe(true);

      // Find markdown content in the section
      const markdownContent = section.content.find(
        (c) => c.type === 'markdown'
      );
      expect(markdownContent).toBeDefined();
      expect(markdownContent.content).toBe(
        sampleMarkdownCourse.sections[0].content[1].content
      );
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

  // New tests for course content update functionality
  describe('PUT /api/courses/:id/content', () => {
    let courseId;

    beforeEach(async () => {
      // Create a test course to update
      const course = await Course.create({
        ...sampleCourse,
        instructor: instructorUser._id, // Use ObjectId
      });
      courseId = course.id; // Use .id
    });

    it('should return 400 for deprecated endpoint as instructor', async () => {
      const updatedContent = [
        {
          title: 'Updated Introduction',
          type: 'video',
          url: 'https://example.com/updated-video',
          order: 1,
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: updatedContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('deprecated');
    });

    it('should return 400 for deprecated endpoint as admin', async () => {
      const updatedContent = [
        {
          title: 'Admin Updated Content',
          type: 'video',
          url: 'https://example.com/admin-video',
          order: 1,
        },
      ];

      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: updatedContent });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('deprecated');
    });

    it('should return 400 for deprecated endpoint with non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/courses/${nonExistentId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          content: [
            {
              title: 'Test Content',
              type: 'video',
              url: 'https://example.com/video',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('deprecated');
    });

    it('should return 400 for deprecated endpoint - empty content validation', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ content: [] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('deprecated');
    });

    it('should return 400 for deprecated endpoint - content type validation', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}/content`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          content: [
            {
              title: 'Invalid Type',
              type: 'invalid_type', // Invalid content type
              url: 'https://example.com/video',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('deprecated');
    });

    it('should return 400 for deprecated endpoint - markdown validation', async () => {
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
      expect(res.body.message).toContain('deprecated');
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
    // let courseIdWithoutContent; // Removed as it's unused after changes

    beforeEach(async () => {
      // Create a test course with content
      const courseWithContentData = {
        ...sampleCourse,
        instructor: instructorUser._id, // Use ObjectId instead of fullName
      };
      const courseWithContent = await Course.create(courseWithContentData);
      courseIdWithContent = courseWithContent.id; // Use .id

      // Create a test course without content - this is now handled within the specific test
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
      // Because there appears to be an issue with the admin role authorization,
      // we'll adjust this test to either expect 200 or 403 based on implementation
      const res = await request(app)
        .patch(`/api/courses/${courseIdWithContent}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Controller logic allows admin to publish, so expect 200
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('published successfully');
      // Verify the course was updated in the database
      const updatedCourse = await Course.findById(courseIdWithContent);
      expect(updatedCourse.status).toBe('published');
    });

    it('should not allow publishing a course without content', async () => {
      // Create a course without content specifically for this test
      const courseWithoutContentData = {
        title: 'Test Course No Content',
        description: 'A course for testing publish without content',
        price: 10,
        duration: 1,
        instructor: instructorUser._id, // Use ObjectId
        sections: [], // Ensure sections are empty
      };
      const course = await Course.create(courseWithoutContentData);

      const res = await request(app)
        .patch(`/api/courses/${course.id}/publish`) // Use .id
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Course must have content to be published'); // Updated assertion
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

  describe('GET /instructor', () => {
    beforeEach(async () => {
      // Clean up previous test data
      await Course.deleteMany({});

      // Create courses for the test instructor
      await Course.create({
        title: 'Draft Course',
        description: 'A draft course',
        price: 29.99,
        duration: 5,
        instructor: instructorUser._id,
        status: 'draft',
        sections: [],
      });

      await Course.create({
        title: 'Published Course',
        description: 'A published course',
        price: 49.99,
        duration: 10,
        instructor: instructorUser._id,
        status: 'published',
        sections: [],
      });

      // Create a course by another instructor
      let otherInstructor = await User.findOne({ email: 'other@test.com' });
      if (!otherInstructor) {
        otherInstructor = await User.create({
          fullName: 'Other Instructor',
          email: 'other@test.com',
          password: 'password123',
          role: 'instructor',
        });
      }

      await Course.create({
        title: 'Other Instructor Course',
        description: 'A course by another instructor',
        price: 39.99,
        duration: 8,
        instructor: otherInstructor._id,
        status: 'published',
        sections: [],
      });
    });

    it('should return all courses created by the instructor', async () => {
      const res = await request(app)
        .get('/api/courses/instructor')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        'Instructor courses retrieved successfully'
      );
      expect(res.body.courses).toHaveLength(2);
      expect(res.body.totalCourses).toBe(2);

      // Check that both draft and published courses are included
      const courseTitles = res.body.courses.map((course) => course.title);
      expect(courseTitles).toContain('Draft Course');
      expect(courseTitles).toContain('Published Course');

      // Ensure the other instructor's course is not included
      expect(courseTitles).not.toContain('Other Instructor Course');
    });

    it('should allow admin to access instructor courses endpoint', async () => {
      const res = await request(app)
        .get('/api/courses/instructor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        'Instructor courses retrieved successfully'
      );
      expect(res.body.courses).toBeDefined();
    });

    it('should deny access to students', async () => {
      const res = await request(app)
        .get('/api/courses/instructor')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe(
        'Access denied. You do not have the required role.'
      );
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/courses/instructor');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('No token, authorization denied');
    });

    it('should return empty array when instructor has no courses', async () => {
      // Create a new instructor with no courses using a unique email
      const uniqueEmail = `newinstructor${Date.now()}@test.com`;
      const newInstructor = await User.create({
        fullName: 'New Instructor',
        email: uniqueEmail,
        password: 'password123',
        role: 'instructor',
      });

      const newInstructorToken = jwt.sign(
        { id: newInstructor._id, role: newInstructor.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/courses/instructor')
        .set('Authorization', `Bearer ${newInstructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.courses).toHaveLength(0);
      expect(res.body.totalCourses).toBe(0);
    });
  });
});
