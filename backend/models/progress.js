const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  answer: {
    type: String,
    maxlength: 500, // Maximum length of 500 characters
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
});

// Create a unique compound index to prevent duplicate progress entries
progressSchema.index(
  { userId: 1, courseId: 1, contentId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Progress', progressSchema);
