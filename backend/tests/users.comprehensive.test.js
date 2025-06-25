const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/user');
const Course = require('../models/course');
require('./setup');

describe('User Comprehensive Tests', () => {
  let adminToken, instructorToken, studentToken;
  let adminUser, instructorUser, studentUser;
  let testCourse;

  beforeEach(async () => {
    // Clear the database
    await User.deleteMany({});
    await Course.deleteMany({});

    // Create test users
    await request(app).post('/api/auth/register').send({
      email: 'admin@example.com',
      password: 'password123',
      fullName: 'Test Admin',
    });

    await request(app).post('/api/auth/register').send({
      email: 'instructor@example.com',
      password: 'password123',
      fullName: 'Test Instructor',
    });

    await request(app).post('/api/auth/register').send({
      email: 'student@example.com',
      password: 'password123',
      fullName: 'Test Student',
    });

    // Set up roles first
    adminUser = await User.findOne({ email: 'admin@example.com' });
    instructorUser = await User.findOne({ email: 'instructor@example.com' });
    studentUser = await User.findOne({ email: 'student@example.com' });

    await User.findByIdAndUpdate(adminUser.id, { role: 'admin' });
    await User.findByIdAndUpdate(instructorUser.id, { role: 'instructor' });

    // Now get tokens with correct roles by logging in
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });

    const instructorLoginRes = await request(app).post('/api/auth/login').send({
      email: 'instructor@example.com',
      password: 'password123',
    });

    const studentLoginRes = await request(app).post('/api/auth/login').send({
      email: 'student@example.com',
      password: 'password123',
    });

    adminToken = adminLoginRes.body.accessToken;
    instructorToken = instructorLoginRes.body.accessToken;
    studentToken = studentLoginRes.body.accessToken;

    // Create a test course
    testCourse = await Course.create({
      title: 'Test Course',
      description: 'A test course',
      price: 99.99,
      instructor: instructorUser.id,
      duration: 10,
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
    });
  });

  describe('User Profile - Additional Edge Cases', () => {
    it('should handle server error in getUserProfile', async () => {
      // Mock User.findById to throw an error
      const originalFindById = User.findById;
      User.findById = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');

      // Restore original function
      User.findById = originalFindById;
    });

    it('should handle server error in updateUserProfile', async () => {
      // Mock User.findByIdAndUpdate to throw an error
      const originalFindByIdAndUpdate = User.findByIdAndUpdate;
      User.findByIdAndUpdate = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ fullName: 'Test Name' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');

      // Restore original function
      User.findByIdAndUpdate = originalFindByIdAndUpdate;
    });

    it('should populate enrolledCourses correctly', async () => {
      // Enroll student in test course
      await User.findByIdAndUpdate(studentUser._id, {
        $push: { enrolledCourses: testCourse._id },
      });

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.enrolledCourses).toHaveLength(1);
      expect(res.body.enrolledCourses[0]).toHaveProperty(
        'title',
        'Test Course'
      );
    });
  });

  describe('Admin User Management', () => {
    it('should allow admin to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('should deny non-admin access to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to update user role', async () => {
      const res = await request(app)
        .put(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'instructor' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('instructor');
    });

    it('should allow admin to update enrolled courses', async () => {
      const res = await request(app)
        .put(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ enrolledCourses: [testCourse._id] });

      expect(res.status).toBe(200);
      expect(res.body.user.enrolledCourses).toHaveLength(1);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .put(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid_role' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid role');
    });

    it('should reject non-array enrolledCourses', async () => {
      const res = await request(app)
        .put(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ enrolledCourses: 'not_an_array' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('enrolledCourses must be an array');
    });

    it('should reject update with no valid fields', async () => {
      const res = await request(app)
        .put(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invalidField: 'value' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No valid fields provided for update');
    });

    it('should prevent admin demotion', async () => {
      const res = await request(app)
        .put(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'student' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin accounts cannot be demoted');
    });

    it('should handle invalid user ID format', async () => {
      const res = await request(app)
        .put('/api/users/invalid_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'instructor' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid user ID format');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'instructor' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should deny non-admin user update access', async () => {
      const res = await request(app)
        .put(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });
  });

  describe('User Deletion (Admin)', () => {
    it('should allow admin to delete non-admin users', async () => {
      const res = await request(app)
        .delete(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(studentUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should prevent deletion of admin users', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin accounts cannot be deleted');
    });

    it('should return 404 for non-existent user deletion', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle invalid user ID format for deletion', async () => {
      const res = await request(app)
        .delete('/api/users/invalid_id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid user ID format');
    });

    it('should deny non-admin access to delete users', async () => {
      const res = await request(app)
        .delete(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle server error in getAllUsers', async () => {
      const originalFind = User.find;
      User.find = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');

      User.find = originalFind;
    });

    it('should handle server error in deleteUser', async () => {
      const originalFindById = User.findById;
      User.findById = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .delete(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');

      User.findById = originalFindById;
    });

    it('should handle database error in updateUser', async () => {
      const originalFindByIdAndUpdate = User.findByIdAndUpdate;
      User.findByIdAndUpdate = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .put(`/api/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'instructor' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');

      User.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });
});
