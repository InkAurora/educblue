const request = require('supertest');
require('../setup'); // Set up in-memory MongoDB for tests
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../index');
const User = require('../../models/user');
const Course = require('../../models/course');
const Progress = require('../../models/progress');

describe('Analytics Controller', () => {
  let adminToken;
  let regularToken;
  let adminUser;
  let regularUser;
  let course1;

  beforeEach(async () => {
    // Create a test admin user
    adminUser = await User.create({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    // Create a regular user
    regularUser = await User.create({
      fullName: 'Regular User',
      email: 'regular@example.com',
      password: 'password123',
      role: 'student',
    });

    // Create an instructor user
    await User.create({
      fullName: 'Instructor User',
      email: 'instructor@example.com',
      password: 'password123',
      role: 'instructor',
    });

    // Create some test courses
    course1 = await Course.create({
      title: 'Test Course 1',
      description: 'This is a test course',
      instructor: 'Instructor User',
      price: 99.99,
      status: 'published',
      duration: 10, // Added duration
      content: [
        {
          title: 'Test Content 1',
          type: 'video',
          _id: new mongoose.Types.ObjectId(),
        },
      ], // Added dummy content with _id
    });

    await Course.create({
      title: 'Test Course 2',
      description: 'This is another test course',
      instructor: 'Instructor User',
      price: 149.99,
      status: 'draft',
      duration: 5, // Added duration
      content: [
        {
          title: 'Test Content 2',
          type: 'video',
          _id: new mongoose.Types.ObjectId(),
        },
      ],
    });

    // Create some progress records
    await Progress.create({
      userId: regularUser._id,
      courseId: course1._id,
      contentId: course1.content[0]._id,
      completed: true,
      completionPercentage: 75, // Ensure this is set for the test
    });

    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role, email: adminUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    regularToken = jwt.sign(
      { id: regularUser._id, role: regularUser.role, email: regularUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Progress.deleteMany({});
  });

  describe('GET /api/analytics', () => {
    it('should allow admin to get global analytics', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Check users section
      expect(response.body).toHaveProperty('users');
      expect(response.body.users).toHaveProperty('total', 3); // admin, regular, instructor
      expect(response.body.users).toHaveProperty('byRole');
      expect(response.body.users.byRole).toHaveProperty('admin', 1);
      expect(response.body.users.byRole).toHaveProperty('student', 1);
      expect(response.body.users.byRole).toHaveProperty('instructor', 1);

      // Check courses section
      expect(response.body).toHaveProperty('courses');
      expect(response.body.courses).toHaveProperty('total', 2);
      expect(response.body.courses).toHaveProperty('published', 1);
      expect(response.body.courses).toHaveProperty('draft', 1);

      // Check engagement section
      expect(response.body).toHaveProperty('engagement');
      expect(response.body.engagement).toHaveProperty('averageCompletionRate');
      expect(response.body.engagement.averageCompletionRate).toBe(75); // Only one progress entry with 75%
      expect(response.body.engagement).toHaveProperty(
        'totalProgressEntries',
        1
      );
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/access denied/i);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/analytics');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/no token/i);
    });
  });

  describe('GET /api/analytics/users', () => {
    it('should allow admin to get user analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userGrowth');
      expect(response.body).toHaveProperty('completionStats');
      expect(Array.isArray(response.body.userGrowth)).toBe(true);
      expect(Array.isArray(response.body.completionStats)).toBe(true);
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/analytics/users')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/access denied/i);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/analytics/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/no token/i);
    });
  });

  describe('GET /api/analytics/financial', () => {
    it('should allow admin to get financial analytics', async () => {
      const courseWithEnrollments = await Course.create({
        title: 'Test Course with Enrollments',
        description: 'This is a test course with enrollments',
        instructor: 'Instructor User',
        price: 100,
        status: 'published',
        duration: 10,
        enrolledStudents: [regularUser._id],
        content: [
          {
            title: 'Enrollment Content',
            type: 'video',
            _id: new mongoose.Types.ObjectId(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/analytics/financial')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('revenueOverTime');
      expect(response.body).toHaveProperty('courseRevenue');
      expect(response.body).toHaveProperty('totalEstimatedRevenue');
      expect(Array.isArray(response.body.revenueOverTime)).toBe(true);
      expect(response.body.revenueOverTime.length).toBeGreaterThan(0);
      expect(Array.isArray(response.body.courseRevenue)).toBe(true);
      const relevantCourseRevenue = response.body.courseRevenue.find(
        (cr) => cr.title === courseWithEnrollments.title
      );
      expect(relevantCourseRevenue).toBeDefined();
      expect(relevantCourseRevenue.price).toBe(100);
      expect(response.body.totalEstimatedRevenue).toBeGreaterThanOrEqual(0);

      await Course.findByIdAndDelete(courseWithEnrollments._id);
    });

    it('should deny access to non-admin users for financial analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/financial')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/access denied/i);
    });

    it('should require authentication for financial analytics', async () => {
      const response = await request(app).get('/api/analytics/financial');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/no token/i);
    });
  });
});
