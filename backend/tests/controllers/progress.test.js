const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');
const User = require('../../models/user');
const Course = require('../../models/course');
const Progress = require('../../models/progress');
require('../setup');

describe('Progress Controller', () => {
  let authToken;
  let userId;
  let courseId;
  let contentId;
  let quizContentId;
  let multipleChoiceContentId;

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
        type: 'video',
        videoUrl: 'https://example.com/video1',
      },
      {
        title: 'Text Quiz',
        type: 'quiz',
        content: 'This is a quiz question',
      },
      {
        title: 'Multiple Choice Quiz',
        type: 'multipleChoice',
        question: 'Which planet is closest to the sun?',
        options: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correctOption: 0,
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

    // Get content IDs
    contentId = course.content[0]._id; // video content
    quizContentId = course.content[1]._id; // regular quiz content
    multipleChoiceContentId = course.content[2]._id; // multiple choice quiz content

    // Enroll the user in the course
    await User.findByIdAndUpdate(userId, {
      $push: { enrolledCourses: courseId },
    });
  });

  describe('POST /api/progress/:courseId/:contentId - Multiple Choice Quiz', () => {
    it('should save answer and score for multiple choice quiz with correct answer', async () => {
      const res = await request(app)
        .post(`/api/progress/${courseId}/${multipleChoiceContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 0 }); // Correct answer is 0 (Mercury)

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId', userId);
      expect(res.body).toHaveProperty('courseId', courseId.toString());
      expect(res.body).toHaveProperty(
        'contentId',
        multipleChoiceContentId.toString()
      );
      expect(res.body).toHaveProperty('completed', true);
      expect(res.body).toHaveProperty('answer', '0');
      expect(res.body).toHaveProperty('score', 1); // Perfect score for correct answer

      // Verify the record was created in the database
      const record = await Progress.findOne({
        userId,
        courseId,
        contentId: multipleChoiceContentId,
      });

      expect(record).toBeTruthy();
      expect(record.answer).toBe('0');
      expect(record.score).toBe(1);
    });

    it('should save answer and score for multiple choice quiz with incorrect answer', async () => {
      const res = await request(app)
        .post(`/api/progress/${courseId}/${multipleChoiceContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 1 }); // Incorrect answer (Venus)

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId', userId);
      expect(res.body).toHaveProperty('courseId', courseId.toString());
      expect(res.body).toHaveProperty(
        'contentId',
        multipleChoiceContentId.toString()
      );
      expect(res.body).toHaveProperty('completed', true);
      expect(res.body).toHaveProperty('answer', '1');
      expect(res.body).toHaveProperty('score', 0); // Score of 0 for incorrect answer

      // Verify the record was created in the database
      const record = await Progress.findOne({
        userId,
        courseId,
        contentId: multipleChoiceContentId,
      });

      expect(record).toBeTruthy();
      expect(record.answer).toBe('1');
      expect(record.score).toBe(0);
    });

    it('should return 400 for invalid multiple choice answers (out of range)', async () => {
      const res = await request(app)
        .post(`/api/progress/${courseId}/${multipleChoiceContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 5 }); // Out of range (0-3)

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        'For multiple choice questions, answer must be a number between 0 and 3'
      );
    });

    it('should return 400 for invalid multiple choice answers (non-numeric)', async () => {
      const res = await request(app)
        .post(`/api/progress/${courseId}/${multipleChoiceContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 'abc' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        'For multiple choice questions, answer must be a number between 0 and 3'
      );
    });

    it('should allow resubmission to update answer and score', async () => {
      // First submission - incorrect answer
      await request(app)
        .post(`/api/progress/${courseId}/${multipleChoiceContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 1 }); // Incorrect answer (Venus)

      // Second submission - correct answer
      const res = await request(app)
        .post(`/api/progress/${courseId}/${multipleChoiceContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 0 }); // Correct answer (Mercury)

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('answer', '0');
      expect(res.body).toHaveProperty('score', 1); // Updated to perfect score

      // Verify the record was updated in the database
      const record = await Progress.findOne({
        userId,
        courseId,
        contentId: multipleChoiceContentId,
      });

      expect(record).toBeTruthy();
      expect(record.answer).toBe('0');
      expect(record.score).toBe(1);
    });
  });

  describe('GET /api/progress/:courseId - Multiple Choice Quiz Progress', () => {
    it('should include score field in progress records', async () => {
      // Create a progress record for multiple choice
      await Progress.create({
        userId,
        courseId,
        contentId: multipleChoiceContentId,
        completed: true,
        completedAt: new Date(),
        answer: '0',
        score: 1,
      });

      const res = await request(app)
        .get(`/api/progress/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('answer', '0');
      expect(res.body[0]).toHaveProperty('score', 1);
    });
  });

  describe('Non-enrolled User Access', () => {
    it('should deny access to non-enrolled users for submitting progress', async () => {
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
        .post(`/api/progress/${courseId}/${multipleChoiceContentId}`)
        .set('Authorization', `Bearer ${nonEnrolledToken}`)
        .send({ answer: 0 });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('Missing Content/Course Handling', () => {
    it('should return 404 for non-existent course', async () => {
      const nonExistentCourseId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/progress/${nonExistentCourseId}/${multipleChoiceContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 0 });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Course not found');
    });

    it('should return 404 for non-existent content', async () => {
      const nonExistentContentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/progress/${courseId}/${nonExistentContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 0 });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Content not found');
    });
  });
});
