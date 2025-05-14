// filepath: c:\Users\INK\Desktop\educblue\backend\tests\models\progress.test.js
const { describe, it, expect } = require('@jest/globals');
const mongoose = require('mongoose');
const Progress = require('../../models/progress');
require('../setup');

describe('Progress Model', () => {
  let userId;
  let courseId;
  let contentId;

  beforeEach(() => {
    // Create fresh IDs for each test
    userId = new mongoose.Types.ObjectId();
    courseId = new mongoose.Types.ObjectId();
    contentId = new mongoose.Types.ObjectId();
  });

  it('should create a valid progress record with required fields', async () => {
    const validProgress = {
      userId,
      courseId,
      contentId,
      completed: true,
      completedAt: new Date(),
    };

    const progress = new Progress(validProgress);
    const savedProgress = await progress.save();

    expect(savedProgress._id).toBeDefined();
    expect(savedProgress.userId.toString()).toBe(userId.toString());
    expect(savedProgress.courseId.toString()).toBe(courseId.toString());
    expect(savedProgress.contentId.toString()).toBe(contentId.toString());
    expect(savedProgress.completed).toBe(true);
    expect(savedProgress.completedAt).toBeDefined();
    // Default score should be 0
    expect(savedProgress.score).toBe(0);
  });

  it('should allow optional answer field', async () => {
    const testAnswer = 'This is a test answer for a quiz question';

    const progressWithAnswer = {
      userId,
      courseId,
      contentId,
      completed: true,
      completedAt: new Date(),
      answer: testAnswer,
    };

    const progress = new Progress(progressWithAnswer);
    const savedProgress = await progress.save();

    expect(savedProgress._id).toBeDefined();
    expect(savedProgress.answer).toBe(testAnswer);
  });

  it('should allow setting a score for quiz performance', async () => {
    const progressWithScore = {
      userId,
      courseId,
      contentId,
      completed: true,
      completedAt: new Date(),
      answer: '2', // Answer for multiple choice quiz
      score: 1, // Perfect score
    };

    const progress = new Progress(progressWithScore);
    const savedProgress = await progress.save();

    expect(savedProgress._id).toBeDefined();
    expect(savedProgress.score).toBe(1);
  });

  it('should enforce score min and max constraints', async () => {
    // Test score below minimum (0)
    const belowMinProgress = {
      userId,
      courseId,
      contentId,
      score: -0.5,
    };

    const progress1 = new Progress(belowMinProgress);
    try {
      await progress1.save();
      // If it doesn't throw, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
      expect(error.errors.score).toBeDefined();
    }

    // Test score above maximum (1)
    const aboveMaxProgress = {
      userId,
      courseId,
      contentId,
      score: 1.5,
    };

    const progress2 = new Progress(aboveMaxProgress);
    try {
      await progress2.save();
      // If it doesn't throw, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
      expect(error.errors.score).toBeDefined();
    }
  });

  it('should enforce maximum length for answer field', async () => {
    // Create an answer that exceeds 500 characters
    const longAnswer = 'a'.repeat(501);

    const progressWithLongAnswer = {
      userId,
      courseId,
      contentId,
      completed: true,
      completedAt: new Date(),
      answer: longAnswer,
    };

    const progress = new Progress(progressWithLongAnswer);

    try {
      await progress.save();
      // If it doesn't throw, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
      expect(error.errors.answer).toBeDefined();
    }
  });

  it('should not allow duplicate progress entries for the same user, course, and content', async () => {
    const progressData = {
      userId,
      courseId,
      contentId,
      completed: true,
      completedAt: new Date(),
    };

    // Save the first instance
    const progress1 = new Progress(progressData);
    await progress1.save();

    // Try to save a duplicate instance
    const progress2 = new Progress(progressData);

    try {
      await progress2.save();
      // If it doesn't throw, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      // MongoDB duplicate key error code
      expect(error.code).toBe(11000);
    }
  });

  it('should allow updating an existing progress record with an answer', async () => {
    // First create a progress record without an answer
    const initialProgress = {
      userId,
      courseId,
      contentId,
      completed: true,
      completedAt: new Date(),
    };

    const progress = new Progress(initialProgress);
    await progress.save();

    // Now update with an answer
    const testAnswer = 'Updated answer for the quiz';

    // Find and update the progress record
    const updatedProgress = await Progress.findOneAndUpdate(
      { userId, courseId, contentId },
      { answer: testAnswer },
      { new: true }
    );

    expect(updatedProgress.answer).toBe(testAnswer);

    // Double check by retrieving again
    const retrievedProgress = await Progress.findOne({
      userId,
      courseId,
      contentId,
    });

    expect(retrievedProgress.answer).toBe(testAnswer);
  });

  it('should allow updating an existing progress record with a score', async () => {
    // First create a progress record without a score
    const initialProgress = {
      userId,
      courseId,
      contentId,
      completed: true,
      completedAt: new Date(),
    };

    const progress = new Progress(initialProgress);
    await progress.save();

    // Now update with a score
    // Find and update the progress record
    const updatedProgress = await Progress.findOneAndUpdate(
      { userId, courseId, contentId },
      { score: 1 }, // Perfect score
      { new: true }
    );

    expect(updatedProgress.score).toBe(1);

    // Double check by retrieving again
    const retrievedProgress = await Progress.findOne({
      userId,
      courseId,
      contentId,
    });

    expect(retrievedProgress.score).toBe(1);
  });

  it('should require userId, courseId and contentId fields', async () => {
    const invalidProgress = {
      completed: true,
      completedAt: new Date(),
    };

    const progress = new Progress(invalidProgress);

    try {
      await progress.save();
      // If it doesn't throw, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.courseId).toBeDefined();
      expect(error.errors.contentId).toBeDefined();
    }
  });
});
