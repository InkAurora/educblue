const { describe, it, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Course = require('../models/course');
require('./setup');

describe('Course Endpoints', () => {
  beforeEach(async () => {
    await Course.deleteMany({});
  });

  const sampleCourse = {
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
    ],
  };

  describe('POST /api/courses', () => {
    it('should create a new course successfully', async () => {
      const res = await request(app).post('/api/courses').send(sampleCourse);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe(sampleCourse.title);
      expect(res.body.description).toBe(sampleCourse.description);
    });

    it('should validate required fields', async () => {
      const res = await request(app).post('/api/courses').send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/courses', () => {
    it('should get all courses', async () => {
      // Create test courses
      await Course.create(sampleCourse);
      await Course.create({
        ...sampleCourse,
        title: 'Another Course',
      });

      const res = await request(app).get('/api/courses');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should get course by id', async () => {
      const course = await Course.create(sampleCourse);

      const res = await request(app).get(`/api/courses/${course._id}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(course._id.toString());
      expect(res.body.title).toBe(course.title);
    });

    it('should return 404 for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/courses/${nonExistentId}`);

      expect(res.status).toBe(404);
    });
  });
});
