const { describe, it, expect } = require('@jest/globals');
const mongoose = require('mongoose');
const Course = require('../../models/course');
require('../setup');

describe('Course Model', () => {
  it('should create a valid course with required fields', async () => {
    const validCourse = {
      title: 'Test Course',
      description: 'This is a test course',
      price: 99.99,
      instructor: 'Test Instructor',
      duration: 10,
    };

    const course = new Course(validCourse);
    const savedCourse = await course.save();

    expect(savedCourse._id).toBeDefined();
    expect(savedCourse.title).toBe(validCourse.title);
    expect(savedCourse.description).toBe(validCourse.description);
    expect(savedCourse.price).toBe(validCourse.price);
    expect(savedCourse.instructor).toBe(validCourse.instructor);
    expect(savedCourse.duration).toBe(validCourse.duration);
    expect(savedCourse.status).toBe('draft'); // Default value
  });

  it('should create a course with multiple content types', async () => {
    const courseWithContent = {
      title: 'Full Course',
      description: 'Course with various content types',
      price: 149.99,
      instructor: 'Test Instructor',
      duration: 20,
      content: [
        {
          title: 'Introduction',
          type: 'video',
          videoUrl: 'https://example.com/video1',
        },
        {
          title: 'Reading Material',
          type: 'markdown',
          content: '# Heading\nThis is some markdown content.',
        },
        {
          title: 'Text Quiz',
          type: 'quiz',
          content: 'What is the capital of France?',
        },
        {
          title: 'Multiple Choice Quiz',
          type: 'multipleChoice',
          question: 'Which planet is closest to the sun?',
          options: ['Mercury', 'Venus', 'Earth', 'Mars'],
          correctOption: 0, // Mercury
        },
      ],
    };

    const course = new Course(courseWithContent);
    const savedCourse = await course.save();

    expect(savedCourse._id).toBeDefined();
    expect(savedCourse.content.length).toBe(4);

    // Check multiple choice content
    const multipleChoice = savedCourse.content.find(
      (c) => c.type === 'multipleChoice'
    );
    expect(multipleChoice).toBeDefined();
    expect(multipleChoice.question).toBe('Which planet is closest to the sun?');
    expect(multipleChoice.options).toHaveLength(4);
    expect(multipleChoice.options[0]).toBe('Mercury');
    expect(multipleChoice.correctOption).toBe(0);
  });

  describe('MultipleChoice Content Type Validation', () => {
    it('should validate options array length for multipleChoice content', async () => {
      const courseWithInvalidOptions = {
        title: 'Invalid Course',
        description: 'Course with invalid multiple choice options',
        price: 49.99,
        instructor: 'Test Instructor',
        duration: 5,
        content: [
          {
            title: 'Multiple Choice Quiz',
            type: 'multipleChoice',
            question: 'Which is the largest ocean?',
            options: ['Pacific', 'Atlantic', 'Indian'], // Only 3 options, should be 4
            correctOption: 0,
          },
        ],
      };

      const course = new Course(courseWithInvalidOptions);

      try {
        await course.save();
        // If it doesn't throw, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.name).toBe('ValidationError');
        expect(error.errors['content.0.options']).toBeDefined();
      }
    });

    it('should validate correctOption is within range for multipleChoice content', async () => {
      const courseWithInvalidCorrectOption = {
        title: 'Invalid Course',
        description: 'Course with invalid correct option',
        price: 49.99,
        instructor: 'Test Instructor',
        duration: 5,
        content: [
          {
            title: 'Multiple Choice Quiz',
            type: 'multipleChoice',
            question: 'Which is the largest desert?',
            options: ['Antarctica', 'Sahara', 'Arctic', 'Gobi'],
            correctOption: 4, // Out of range (0-3)
          },
        ],
      };

      const course = new Course(courseWithInvalidCorrectOption);

      try {
        await course.save();
        // If it doesn't throw, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.name).toBe('ValidationError');
        expect(error.errors['content.0.correctOption']).toBeDefined();
      }
    });

    it('should validate required fields for multipleChoice content', async () => {
      const courseWithMissingFields = {
        title: 'Invalid Course',
        description: 'Course with missing multiple choice fields',
        price: 49.99,
        instructor: 'Test Instructor',
        duration: 5,
        content: [
          {
            title: 'Multiple Choice Quiz',
            type: 'multipleChoice',
            // Missing question, options, and correctOption
          },
        ],
      };

      const course = new Course(courseWithMissingFields);

      try {
        await course.save();
        // If it doesn't throw, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.name).toBe('ValidationError');
        expect(error.errors['content.0.question']).toBeDefined();
        expect(error.errors['content.0.options']).toBeDefined();
        expect(error.errors['content.0.correctOption']).toBeDefined();
      }
    });
  });

  it('should not require quiz-specific fields for other content types', async () => {
    const courseWithNonQuizContent = {
      title: 'Regular Course',
      description: 'Course with regular content',
      price: 79.99,
      instructor: 'Test Instructor',
      duration: 15,
      content: [
        {
          title: 'Video Lecture',
          type: 'video',
          videoUrl: 'https://example.com/video2',
          // No quiz fields needed
        },
      ],
    };

    const course = new Course(courseWithNonQuizContent);
    const savedCourse = await course.save();

    expect(savedCourse._id).toBeDefined();
    expect(savedCourse.content[0].type).toBe('video');
    expect(savedCourse.content[0].videoUrl).toBe('https://example.com/video2');
  });
});
