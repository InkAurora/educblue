const {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} = require('@jest/globals');
const request = require('supertest');
const app = require('../../index');
const User = require('../../models/user');
require('../testSetup'); // Import for setup but don't redeclare jest

describe('Setup Admin Controller', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    // Set admin setup secret for testing
    process.env.ADMIN_SETUP_SECRET = 'test-secret-key';

    // Clear users before each test
    await User.deleteMany({});
  }, 30000); // 30s timeout

  afterEach(async () => {
    // Restore original env variables
    process.env = originalEnv;

    // Clean up
    await User.deleteMany({});
  }, 30000); // 30s timeout

  it('should promote a user to admin with valid secret key', async () => {
    // Create a test user first
    await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'student',
    });

    const res = await request(app).post('/api/setup-admin').send({
      email: 'test@example.com',
      secretKey: 'test-secret-key',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('promoted to admin');

    // Verify user is now an admin
    const updatedUser = await User.findOne({ email: 'test@example.com' });
    expect(updatedUser.role).toBe('admin');
  }, 30000); // 30s timeout

  it('should reject requests with invalid secret key', async () => {
    // Create a test user first
    await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'student',
    });

    const res = await request(app).post('/api/setup-admin').send({
      email: 'test@example.com',
      secretKey: 'wrong-secret-key',
    });

    expect(res.status).toBe(403); // Changed from 401 to 403
    expect(res.body.message).toContain('Invalid');

    // Verify user is still a student
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user.role).toBe('student');
  }, 30000); // 30s timeout

  it('should return 404 for non-existent user', async () => {
    const res = await request(app).post('/api/setup-admin').send({
      email: 'nonexistent@example.com',
      secretKey: 'test-secret-key',
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found');
  }, 30000); // 30s timeout

  it('should require email and secretKey', async () => {
    // Missing email
    const res1 = await request(app).post('/api/setup-admin').send({
      secretKey: 'test-secret-key',
    });
    expect(res1.status).toBe(400);

    // Missing secretKey
    const res2 = await request(app).post('/api/setup-admin').send({
      email: 'test@example.com',
    });
    expect(res2.status).toBe(400);
  }, 30000); // 30s timeout
});
