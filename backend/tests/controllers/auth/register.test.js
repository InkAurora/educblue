const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const User = require('../../../models/user');
require('../../setup');

describe('User Registration Endpoints', () => {
  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        fullName: 'New User',
        role: 'student',
      };

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      // Verify the user was created in the database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.fullName).toBe(userData.fullName);
      expect(user.role).toBe(userData.role);
    });

    it('should generate fullName from email if not provided', async () => {
      const userData = {
        email: 'auto-username@test.com',
        password: 'password123',
        role: 'student',
      };

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(201);

      // Verify the user was created with generated fullName
      const user = await User.findOne({ email: userData.email });
      expect(user.fullName).toBe('auto-username');
    });

    it('should not register a user with existing email', async () => {
      // Create a user first
      await User.create({
        email: 'existing@test.com',
        password: 'password123',
        fullName: 'Existing User',
        role: 'student',
      });

      // Try to register with the same email
      const userData = {
        email: 'existing@test.com',
        password: 'newpassword',
        fullName: 'New User',
        role: 'student',
      };

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('User already exists');
    });

    it('should validate required fields', async () => {
      // Missing email
      const res1 = await request(app).post('/api/auth/register').send({
        password: 'password123',
      });

      expect(res1.status).toBe(400);
      expect(res1.body.message).toContain('required');

      // Missing password
      const res2 = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
      });

      expect(res2.status).toBe(400);
      expect(res2.body.message).toContain('required');
    });

    it('should hash the password before saving', async () => {
      const userData = {
        email: 'secure@test.com',
        password: 'password123',
        role: 'student',
      };

      await request(app).post('/api/auth/register').send(userData);

      // Verify the password is hashed
      const user = await User.findOne({ email: userData.email });
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[aby]\$/); // BCrypt hash prefix
    });

    it('should save refresh tokens', async () => {
      const userData = {
        email: 'tokenuser@test.com',
        password: 'password123',
        role: 'student',
      };

      const res = await request(app).post('/api/auth/register').send(userData);

      // Verify the refresh token was saved
      const user = await User.findOne({ email: userData.email });
      expect(user.refreshTokens).toHaveLength(1);
      expect(user.refreshTokens[0]).toBe(res.body.refreshToken);
    });

    it('should include user info in access token', async () => {
      const userData = {
        email: 'tokeninfo@test.com',
        password: 'password123',
        role: 'instructor',
        fullName: 'Token User',
      };

      const res = await request(app).post('/api/auth/register').send(userData);

      // Decode the token and check its contents
      const decoded = jwt.verify(
        res.body.accessToken,
        process.env.JWT_SECRET || 'testsecret'
      );

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email', userData.email);
      expect(decoded).toHaveProperty('role', userData.role);
      expect(decoded).toHaveProperty('fullName', userData.fullName);
    });
  });
});
