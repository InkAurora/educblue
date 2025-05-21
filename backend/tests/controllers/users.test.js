process.env.JWT_SECRET = 'testsecret';
require('dotenv').config();
const {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');
const User = require('../../models/user');
const Course = require('../../models/course');
require('../testSetup');
require('../setup');

describe('User Controller', () => {
  let adminToken;
  let regularUserToken;
  let testUserId;
  let adminUserId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});

    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });
    adminUserId = admin.id;

    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });

    if (adminLoginRes.status !== 200 || !adminLoginRes.body.accessToken) {
      throw new Error(
        `Admin login failed. Status: ${adminLoginRes.status}, Body: ${JSON.stringify(
          adminLoginRes.body
        )}`
      );
    }
    adminToken = adminLoginRes.body.accessToken;

    const testUser = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'student',
    });
    testUserId = testUser.id;

    const regularUserForTest = await User.create({
      fullName: 'Regular User For Test',
      email: 'regularfortest@example.com',
      password: 'password123',
      role: 'student',
    });

    const regularLoginRes = await request(app).post('/api/auth/login').send({
      email: 'regularfortest@example.com',
      password: 'password123',
    });

    if (regularLoginRes.status !== 200 || !regularLoginRes.body.accessToken) {
      throw new Error(
        `Regular user login failed. Status: ${regularLoginRes.status}, Body: ${JSON.stringify(
          regularLoginRes.body
        )}`
      );
    }
    regularUserToken = regularLoginRes.body.accessToken;
  }, 45000);

  afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
  });

  it('should allow admin to get all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
    expect(res.body.some((user) => user.email === 'admin@example.com')).toBe(
      true
    );
    expect(res.body.some((user) => user.email === 'test@example.com')).toBe(
      true
    );
    expect(
      res.body.some((user) => user.email === 'regularfortest@example.com')
    ).toBe(true);
  });

  it('should deny non-admin access to get all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${regularUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Access denied. Admin permissions required');
  });

  it('should allow admin to update a user role', async () => {
    const res = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'instructor' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('instructor');

    const updatedUser = await User.findById(testUserId);
    expect(updatedUser.role).toBe('instructor');
  });

  it('should allow admin to update enrolled courses for a user', async () => {
    const course = await Course.create({
      title: 'Test Course for Enrollment',
      description: 'Test description',
      price: 10,
      instructor: adminUserId,
      duration: 1,
      content: [
        { title: 'Lesson 1', type: 'markdown', content: 'Hello world' },
      ],
    });

    const res = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enrolledCourses: [course.id] });

    expect(res.status).toBe(200);
    expect(res.body.user.enrolledCourses.length).toBe(1);
    // eslint-disable-next-line no-underscore-dangle
    expect(res.body.user.enrolledCourses[0]._id.toString()).toBe(
      course.id.toString()
    );

    const updatedUser = await User.findById(testUserId);
    expect(updatedUser.enrolledCourses.length).toBe(1);
    expect(updatedUser.enrolledCourses[0].toString()).toBe(
      course.id.toString()
    );
  });

  it('should reject updating with an invalid role', async () => {
    const res = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'superuser' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'Invalid role. Must be one of: student, instructor, admin'
    );
  });

  it('should deny non-admin access to update a user', async () => {
    const res = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ role: 'instructor' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Access denied. Admin permissions required');
  });

  it('should return 404 when admin tries to update a non-existent user', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/users/${nonExistentUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'instructor' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('should return 400 if no valid fields are provided for update by admin', async () => {
    const res = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ someOtherField: 'someValue' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No valid fields provided for update');
  });

  it('should return 400 for invalid user ID format when admin updates user', async () => {
    const res = await request(app)
      .put('/api/users/invalidUserIdFormat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'instructor' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid user ID format');
  });
});
