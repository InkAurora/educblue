const { describe, it, expect, beforeEach } = require('@jest/globals');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const request = require('supertest');
const app = require('../../../index'); // Changed from ../../../app to ../../../index.js
const User = require('../../../models/user');
const Course = require('../../../models/course');
const Progress = require('../../../models/progress');
require('../../setup');

describe('Course Analytics API', () => {
  let instructorToken;
  let studentToken;
  let courseId;
  let studentId;
  let student2Id; // Declare student2Id
  let student3Id; // Declare student3Id
  let quizContentId;
  let mcContentId;
  let videoContentId;

  const instructor = {
    email: 'instructor@test.com',
    password: 'password123',
    role: 'instructor',
    fullName: 'Test Instructor',
  };

  const student1 = {
    email: 'student1@test.com',
    password: 'password123',
    role: 'student',
    fullName: 'Student One',
  };

  const student2 = {
    email: 'student2@test.com',
    password: 'password123',
    role: 'student',
    fullName: 'Student Two',
  };

  const student3 = {
    email: 'student3@test.com',
    password: 'password123',
    role: 'student',
    fullName: 'Student Three',
  };

  const testCourse = {
    title: 'Test Analytics Course',
    description: 'Course for testing analytics',
    price: 99.99,
    duration: 10,
    content: [
      {
        title: 'Video Lecture',
        type: 'video',
        videoUrl: 'https://example.com/video',
      },
      {
        title: 'Quiz Question',
        type: 'quiz',
        content: 'This is a quiz question',
      },
      {
        title: 'Multiple Choice Question',
        type: 'multipleChoice',
        question: 'Which is the correct answer?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctOption: 2,
      },
    ],
  };

  beforeEach(async () => {
    // Clear the database
    await User.deleteMany({});
    await Course.deleteMany({});
    await Progress.deleteMany({});

    // Create instructor user and get auth token
    const instructorRes = await request(app)
      .post('/api/auth/register')
      .send(instructor);

    instructorToken =
      instructorRes.body.token || instructorRes.body.accessToken;

    // Create student users
    const student1Res = await request(app)
      .post('/api/auth/register')
      .send(student1);
    studentToken = student1Res.body.accessToken; // Assign the student token

    // eslint-disable-next-line no-console
    // console.log('student1Res.body:', student1Res.body);
    const decodedStudent1 = jwt.decode(student1Res.body.accessToken);
    studentId = decodedStudent1.id;

    const student2Res = await request(app)
      .post('/api/auth/register')
      .send(student2);

    // eslint-disable-next-line no-console
    // console.log('student2Res.body:', student2Res.body);
    const decodedStudent2 = jwt.decode(student2Res.body.accessToken);
    student2Id = decodedStudent2.id;

    const student3Res = await request(app)
      .post('/api/auth/register')
      .send(student3);

    // eslint-disable-next-line no-console
    // console.log('student3Res.body:', student3Res.body);
    const decodedStudent3 = jwt.decode(student3Res.body.accessToken);
    student3Id = decodedStudent3.id;

    // Create test course with the instructor as the creator
    testCourse.instructor = instructor.fullName;
    const course = await Course.create(testCourse);
    courseId = course.id;

    // Get content IDs
    videoContentId = course.content[0].id;
    quizContentId = course.content[1].id;
    mcContentId = course.content[2].id;

    // Enroll all students in the course
    await User.findByIdAndUpdate(studentId, {
      $push: { enrolledCourses: courseId },
    });

    await User.findByIdAndUpdate(student2Id, {
      $push: { enrolledCourses: courseId },
    });

    await User.findByIdAndUpdate(student3Id, {
      $push: { enrolledCourses: courseId },
    });

    // Create progress records with different scores
    // Student 1: Completed video and both quizzes with perfect score on MC quiz
    await Progress.create({
      userId: studentId,
      courseId,
      contentId: videoContentId,
      completed: true,
      completedAt: new Date(),
    });

    await Progress.create({
      userId: studentId,
      courseId,
      contentId: quizContentId,
      completed: true,
      completedAt: new Date(),
      answer: 'Student 1 answer',
      score: 0.8,
    });

    await Progress.create({
      userId: studentId,
      courseId,
      contentId: mcContentId,
      completed: true,
      completedAt: new Date(),
      answer: '2', // Correct answer
      score: 1.0,
    });

    // Student 2: Just started, only viewed video
    await Progress.create({
      userId: student2Id,
      courseId,
      contentId: videoContentId,
      completed: true,
      completedAt: new Date(),
    });

    // Student 3: Attempted both quizzes but with lower scores
    await Progress.create({
      userId: student3Id,
      courseId,
      contentId: quizContentId,
      completed: true,
      completedAt: new Date(),
      answer: 'Student 3 answer',
      score: 0.5,
    });

    await Progress.create({
      userId: student3Id,
      courseId,
      contentId: mcContentId,
      completed: true,
      completedAt: new Date(),
      answer: '1', // Incorrect answer
      score: 0,
    });
  });

  describe('GET /api/courses/:id/analytics', () => {
    it('should return correct course analytics for an instructor', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/analytics`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('completionRate');
      expect(res.body).toHaveProperty('quizStats');

      // Three students with at least one completed record = 100% completion rate
      expect(res.body.completionRate).toBe(100);

      // Check quiz stats
      expect(res.body.quizStats.length).toBe(2);

      // Get quiz stats by title for easier testing
      const quizStats = res.body.quizStats.reduce((acc, stat) => {
        acc[stat.title] = stat;
        return acc;
      }, {});

      // Quiz Question: average score should be 0.65 ((0.8 + 0.5) / 2)
      expect(quizStats['Quiz Question'].averageScore).toBeCloseTo(0.65, 2);
      expect(quizStats['Quiz Question'].submissionCount).toBe(2);

      // Multiple Choice Question: average score should be 0.5 ((1.0 + 0.0) / 2)
      expect(quizStats['Multiple Choice Question'].averageScore).toBeCloseTo(
        0.5,
        2
      );
      expect(quizStats['Multiple Choice Question'].submissionCount).toBe(2);
    });

    it('should calculate 0% completion rate when no users have completed any content', async () => {
      // Create a new course with no progress records
      const newCourse = {
        title: 'Empty Course',
        description: 'No progress yet',
        price: 49.99,
        duration: 5,
        instructor: instructor.fullName,
        content: [
          {
            title: 'Quiz',
            type: 'quiz',
            content: 'Empty quiz',
          },
        ],
      };

      const emptyCourse = await Course.create(newCourse);

      const res = await request(app)
        .get(`/api/courses/${emptyCourse.id}/analytics`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.completionRate).toBe(0);
      expect(res.body.quizStats.length).toBe(1);
      expect(res.body.quizStats[0].averageScore).toBe(0);
      expect(res.body.quizStats[0].submissionCount).toBe(0);
    });

    it('should return empty quizStats array for a course with no quizzes', async () => {
      // Create a course with only video content
      const videoCourse = {
        title: 'Video Only Course',
        description: 'No quizzes in this course',
        price: 29.99,
        duration: 2,
        instructor: instructor.fullName,
        content: [
          {
            title: 'Video 1',
            type: 'video',
            videoUrl: 'https://example.com/video1',
          },
          {
            title: 'Video 2',
            type: 'video',
            videoUrl: 'https://example.com/video2',
          },
        ],
      };

      const course = await Course.create(videoCourse);

      const res = await request(app)
        .get(`/api/courses/${course.id}/analytics`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.completionRate).toBe(0);
      expect(res.body.quizStats).toEqual([]);
    });

    it('should return 404 for a non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/courses/${nonExistentId}/analytics`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Course not found');
    });

    it('should return 403 when non-instructor tries to access analytics', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/analytics`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('should return 403 when a different instructor tries to access analytics', async () => {
      // Create another instructor
      const otherInstructor = {
        email: 'other@test.com',
        password: 'password123',
        role: 'instructor',
        fullName: 'Other Instructor',
      };

      const otherInstructorRes = await request(app)
        .post('/api/auth/register')
        .send(otherInstructor);

      const otherInstructorToken =
        otherInstructorRes.body.token || otherInstructorRes.body.accessToken;

      const res = await request(app)
        .get(`/api/courses/${courseId}/analytics`)
        .set('Authorization', `Bearer ${otherInstructorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });
});
