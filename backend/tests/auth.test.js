const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const app = require('../index');
const User = require('../models/user');
require('./setup');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'password123',
      role: 'student',
      fullName: 'Test User', // Added fullName field
    };

    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(201);
      // Check that either token format exists (not using logical OR with expect)
      if (res.body.token) {
        expect(res.body).toHaveProperty('token');
      } else {
        expect(res.body).toHaveProperty('accessToken');
      }

      const user = await User.findOne({ email: validUser.email });
      expect(user).toBeTruthy();
      expect(user.email).toBe(validUser.email);
      expect(user.role).toBe(validUser.role);
      expect(user.fullName).toBe(validUser.fullName);
    });

    it('should not allow duplicate email registration', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists');
    });

    it('should validate required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      role: 'student',
      fullName: 'Test User', // Added fullName field
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      // Check that either token format exists (not using logical OR with expect)
      if (res.body.token) {
        expect(res.body).toHaveProperty('token');
      } else {
        expect(res.body).toHaveProperty('accessToken');
      }
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });
});
