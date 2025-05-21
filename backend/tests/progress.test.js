const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/user');
const Course = require('../models/course');
const Progress = require('../models/progress');
require('./setup');

describe('Progress Endpoints', () => {
  let authToken;
  let userId;
  let courseId;
  let contentId;
  let quizContentId;

  const testUser = {
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
    fullName: 'Test Student',
  };

  const testCourse = {
    title: 'Test Course',
    description: 'This is a test course',
    price: 99.99,
    instructor: 'Test Instructor',
    duration: 10,
    content: [
      {
        title: 'Introduction',
        videoUrl: 'https://example.com/video1',
        type: 'video',
      },
      {
        title: 'Quiz 1',
        type: 'quiz',
        content: 'This is a quiz question',
      },
    ],
  };

  beforeEach(async () => {
    // Clear the database
    await User.deleteMany({});
    await Course.deleteMany({});
    await Progress.deleteMany({});

    // Create a test user and get auth token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Handle both token formats (old or new)
    authToken = registerRes.body.token || registerRes.body.accessToken;

    // Get userId from token
    try {
      const payload = JSON.parse(
        Buffer.from(authToken.split('.')[1], 'base64').toString()
      );
      userId = payload.id;
    } catch (error) {
      // Find the user directly if token parsing fails
      const user = await User.findOne({ email: testUser.email });
      userId = user._id.toString();
    }

    // Create a test course
    const course = await Course.create(testCourse);
    courseId = course._id;

    // Get actual content IDs from the created course
    contentId = course.content[0]._id;
    quizContentId = course.content[1]._id;

    // Enroll the user in the course
    await User.findByIdAndUpdate(userId, {
      $push: { enrolledCourses: courseId },
    });
  });

  describe('GET /api/progress/:courseId', () => {
    it('should get progress for a course when records exist', async () => {
      // Create some progress records
      await Progress.create({
        userId,
        courseId,
        contentId,
        completed: true,
        completedAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/progress/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('progressRecords');
      expect(Array.isArray(res.body.progressRecords)).toBe(true);
      expect(res.body.progressRecords.length).toBe(1);
      expect(res.body.progressRecords[0]).toHaveProperty('userId', userId);
      expect(res.body.progressRecords[0]).toHaveProperty('completed', true);
      expect(res.body).toHaveProperty('progressPercentage');
    });

    it('should include answer field in progress records', async () => {
      const testAnswer = 'This is my quiz answer';

      // Create progress record with an answer
      await Progress.create({
        userId,
        courseId,
        contentId: quizContentId,
        completed: true,
        completedAt: new Date(),
        answer: testAnswer,
      });

      const res = await request(app)
        .get(`/api/progress/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('progressRecords');
      expect(Array.isArray(res.body.progressRecords)).toBe(true);
      expect(res.body.progressRecords.length).toBe(1);
      expect(res.body.progressRecords[0]).toHaveProperty('answer', testAnswer);
      expect(res.body).toHaveProperty('progressPercentage');
    });

    it('should return 200 with empty records and 0% when no progress records exist', async () => {
      const res = await request(app)
        .get(`/api/progress/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('progressRecords');
      expect(Array.isArray(res.body.progressRecords)).toBe(true);
      expect(res.body.progressRecords.length).toBe(0);
      expect(res.body).toHaveProperty('progressPercentage', 0);
    });

    it('should not allow access without auth token', async () => {
      const res = await request(app).get(`/api/progress/${courseId}`);
      expect(res.status).toBe(401);
    });

    it('should handle invalid course ID format', async () => {
      const invalidCourseId = 'invalid-id';
      const res = await request(app)
        .get(`/api/progress/${invalidCourseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/progress/:courseId/:contentId', () => {
    it('should create a new progress record successfully', async () => {
      const res = await request(app)
        .post(`/api/progress/${courseId}/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId', userId);
      expect(res.body).toHaveProperty('courseId', courseId.toString());
      expect(res.body).toHaveProperty('contentId', contentId.toString());
      expect(res.body).toHaveProperty('completed', true);
      expect(res.body).toHaveProperty('completedAt');

      // Verify the record was created in the database
      const record = await Progress.findOne({ userId, courseId, contentId });
      expect(record).toBeTruthy();
      expect(record.completed).toBe(true);
    });

    it('should save answer with completed status for quiz content', async () => {
      const testAnswer = 'My answer to the quiz question';

      const res = await request(app)
        .post(`/api/progress/${courseId}/${quizContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: testAnswer });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId', userId);
      expect(res.body).toHaveProperty('courseId', courseId.toString());
      expect(res.body).toHaveProperty('contentId', quizContentId.toString());
      expect(res.body).toHaveProperty('completed', true);
      expect(res.body).toHaveProperty('answer', testAnswer);

      // Verify the record was created in the database with the answer
      const record = await Progress.findOne({
        userId,
        courseId,
        contentId: quizContentId,
      });

      expect(record).toBeTruthy();
      expect(record.answer).toBe(testAnswer);
    });

    it('should update an existing progress record', async () => {
      // Create initial progress record
      const initialDate = new Date(2025, 0, 1);
      await Progress.create({
        userId,
        courseId,
        contentId,
        completed: false,
        completedAt: initialDate,
      });

      const res = await request(app)
        .post(`/api/progress/${courseId}/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('completed', true);

      // Verify the record was updated
      const record = await Progress.findOne({ userId, courseId, contentId });
      expect(record.completed).toBe(true);
      expect(new Date(record.completedAt)).not.toEqual(initialDate);
    });

    it('should return 400 for invalid answer (too long)', async () => {
      // Create an answer that exceeds 500 characters
      const longAnswer = 'a'.repeat(501);

      const res = await request(app)
        .post(`/api/progress/${courseId}/${quizContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: longAnswer });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Answer cannot exceed 500 characters');
    });

    it('should return 400 for invalid answer (empty string)', async () => {
      const res = await request(app)
        .post(`/api/progress/${courseId}/${quizContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Answer cannot be empty');
    });

    it('should return 400 for invalid answer (non-string)', async () => {
      const res = await request(app)
        .post(`/api/progress/${courseId}/${quizContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: { invalidType: true } });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Answer must be a string');
    });

    it('should create a new non-instructor user to test enrollment requirement', async () => {
      // Create a new user that isn't enrolled in the course
      const nonEnrolledUser = {
        email: 'nonenrolled@test.com',
        password: 'password123',
        role: 'student',
        fullName: 'Non Enrolled Student',
      };

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(nonEnrolledUser);

      const nonEnrolledToken =
        registerRes.body.token || registerRes.body.accessToken;

      // Try to update progress for a course the user is not enrolled in
      const res = await request(app)
        .post(`/api/progress/${courseId}/${quizContentId}`)
        .set('Authorization', `Bearer ${nonEnrolledToken}`)
        .send({ answer: 'This should fail' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('should require content ID', async () => {
      // Using undefined contentId
      const res = await request(app)
        .post(`/api/progress/${courseId}/undefined`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid content ID format');
    });

    it('should validate content ID format', async () => {
      const invalidContentId = 'invalid-id';
      const res = await request(app)
        .post(`/api/progress/${courseId}/${invalidContentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid ID format');
    });

    it('should not allow access without auth token', async () => {
      const res = await request(app).post(
        `/api/progress/${courseId}/${contentId}`
      );
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentCourseId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/progress/${nonExistentCourseId}/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Course not found');
    });
  });
});
