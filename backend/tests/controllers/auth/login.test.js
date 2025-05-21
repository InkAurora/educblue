const {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
} = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const User = require('../../../models/user');
require('../../setup');

describe('User Auth Endpoints', () => {
  let testUser;
  const plainPassword = 'password123'; // Store plain password

  beforeAll(async () => {
    // Define test user data (without hashing password here)
    testUser = {
      email: 'logintest@test.com',
      // Password will be set to plainPassword and hashed by the model on create
      fullName: 'Login Test User',
      role: 'student',
      refreshTokens: [],
    };
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
    // Re-create the test user with the plain password, model will hash it
    await User.create({ ...testUser, password: plainPassword });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: plainPassword, // Use plain password for login attempt
      };

      const res = await request(app).post('/api/auth/login').send(loginData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      // Verify the token contains correct user data
      const decoded = jwt.verify(
        res.body.accessToken,
        process.env.JWT_SECRET || 'testsecret'
      );
      expect(decoded).toHaveProperty('email', testUser.email);
      expect(decoded).toHaveProperty('role', testUser.role);
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/login').send(loginData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      const res = await request(app).post('/api/auth/login').send(loginData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should save refresh token to user document', async () => {
      const loginData = {
        email: testUser.email,
        password: plainPassword, // Use plain password for login attempt
      };

      const res = await request(app).post('/api/auth/login').send(loginData);

      // Check that the refresh token was saved to the user
      const updatedUser = await User.findOne({ email: testUser.email });
      expect(updatedUser.refreshTokens).toHaveLength(1);
      expect(updatedUser.refreshTokens[0]).toBe(res.body.refreshToken);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should issue a new access token with valid refresh token', async () => {
      // Login first to get a refresh token
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: plainPassword, // Use plain password for login attempt
      });

      // Then use that refresh token
      const { refreshToken } = loginRes.body; // Use object destructuring
      const refreshRes = await request(app).post('/api/auth/refresh').send({
        refreshToken,
      });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body).toHaveProperty('token');

      // Verify the new token is valid
      const decoded = jwt.verify(
        refreshRes.body.token,
        process.env.JWT_SECRET || 'testsecret'
      );
      expect(decoded).toHaveProperty('email', testUser.email);
    });

    it('should reject with invalid refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({
        refreshToken: 'invalid-token',
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid refresh token');
    });

    it('should reject when refresh token is missing', async () => {
      const res = await request(app).post('/api/auth/refresh').send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Refresh token is required');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should remove refresh token on logout', async () => {
      // Login first to get a refresh token
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: plainPassword, // Use plain password for login attempt
      });

      // Get the user and token after login
      const { refreshToken, accessToken } = loginRes.body; // Use object destructuring
      const userAfterLogin = await User.findOne({ email: testUser.email }); // Use const
      expect(userAfterLogin.refreshTokens).toContain(refreshToken);

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);

      // Verify refresh token was removed
      const userAfterLogout = await User.findOne({ email: testUser.email });
      expect(userAfterLogout.refreshTokens).not.toContain(refreshToken);
    });

    it('should require authorization for logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-token' });

      expect(res.status).toBe(401);
    });

    it('should require refresh token for logout', async () => {
      // Login to get access token
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: plainPassword, // Use plain password for login attempt
      });

      // Try to logout without providing a refresh token
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Refresh token is required');
    });
  });
});
