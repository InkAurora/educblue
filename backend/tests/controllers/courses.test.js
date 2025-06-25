process.env.JWT_SECRET = 'testsecret'; // Explicitly set for testing
const {
  describe,
  it,
  expect,
  beforeEach, // Changed from beforeAll to beforeEach for user and token setup
  afterEach,
} = require('@jest/globals');
const request = require('supertest');
const app = require('../../index');
const User = require('../../models/user');
const Course = require('../../models/course');
const { setupUsers } = require('../testSetup'); // Import setupUsers

describe('Admin Course Access Tests', () => {
  describe('Admin access to course management', () => {
    let adminToken;
    let adminUser;
    let instructorToken;
    let courseByInstructor;

    beforeEach(async () => {
      process.env.JWT_SECRET = 'testsecret'; // Ensure JWT_SECRET is set for each test run
      await setupUsers();

      adminUser = await User.findOne({ email: 'admin@example.com' });
      const adminLoginRes = await request(app).post('/api/auth/login').send({
        email: 'admin@example.com',
        password: 'password123',
      });
      adminToken = adminLoginRes.body.accessToken;

      const instructorLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'instructor@example.com',
          password: 'password123',
        });
      instructorToken = instructorLoginRes.body.accessToken;

      const courseData = {
        title: 'Instructor Course for Admin Test',
        description: 'A course by an instructor',
        price: 10,
        duration: 1,
        content: [{ title: 'Intro', type: 'video', videoUrl: 'url' }],
      };
      const courseRes = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(courseData);
      // eslint-disable-next-line no-console
      console.log('Course creation response status:', courseRes.status);
      // eslint-disable-next-line no-console
      console.log(
        'Course creation response body:',
        JSON.stringify(courseRes.body, null, 2)
      );

      if (!courseRes.body || !courseRes.body.course) {
        // eslint-disable-next-line no-console
        console.error('Error creating course for instructor:', courseRes.body);
        throw new Error('Failed to create course for instructor in beforeEach');
      }
      courseByInstructor = courseRes.body.course;
    });

    afterEach(async () => {
      await Course.deleteMany({});
      await User.deleteMany({});
    }, 30000);

    it('should not allow admin to publish a course without content', async () => {
      // Create a course without content for this specific test
      const courseWithoutContent = {
        title: 'Empty Course for Publish Test',
        description: 'A course without content',
        price: 50,
        duration: 1,
        // No content or sections provided
      };

      const createRes = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(courseWithoutContent);

      const emptyCourseId = createRes.body.course._id;

      const res = await request(app)
        .patch(`/api/courses/${emptyCourseId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must have content');
    }, 30000);

    it('should allow admin to update content for a course created by another instructor', async () => {
      const updatedCourseDetails = {
        title: 'Updated Course by Admin',
        description: 'Updated by admin',
        price: 129.99,
        duration: 15,
      };

      const res = await request(app)
        .put(`/api/courses/${courseByInstructor._id}`) // Corrected to use ._id
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedCourseDetails);

      expect(res.status).toBe(200);
      expect(res.body.course.title).toBe(updatedCourseDetails.title);
      expect(res.body.course.description).toBe(
        updatedCourseDetails.description
      );
      expect(res.body.course.price).toBe(updatedCourseDetails.price);
      expect(res.body.course.duration).toBe(updatedCourseDetails.duration);

      const course = await Course.findById(courseByInstructor._id); // Corrected to use ._id
      expect(course.title).toBe(updatedCourseDetails.title);
      expect(course.description).toBe(updatedCourseDetails.description);
      expect(course.price).toBe(updatedCourseDetails.price);
      expect(course.duration).toBe(updatedCourseDetails.duration);
    }, 30000);

    it('should allow admin to create a course directly', async () => {
      const newCourse = {
        title: 'Admin Created Course',
        description: 'A course created directly by an admin.',
        price: 60,
        duration: 6,
        content: [
          {
            title: 'Admin Intro Video',
            type: 'video',
            videoUrl: 'http://example.com/admin-intro.mp4',
          },
        ],
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCourse);

      expect(res.status).toBe(201);
      expect(res.body.course.title).toBe(newCourse.title);
      expect(res.body.course.description).toBe(newCourse.description);
      expect(res.body.course.price).toBe(newCourse.price);
      expect(res.body.course.duration).toBe(newCourse.duration);
      expect(res.body.course.instructor).toBe(adminUser._id.toString());
      expect(res.body.course.status).toBe('draft');
      expect(res.body.course.sections).toEqual([]);
      // Note: Content is now handled via sections and managed separately
    });
  });
});
