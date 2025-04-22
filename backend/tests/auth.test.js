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
    };

    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');

      const user = await User.findOne({ email: validUser.email });
      expect(user).toBeTruthy();
      expect(user.email).toBe(validUser.email);
      expect(user.role).toBe(validUser.role);
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
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
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
