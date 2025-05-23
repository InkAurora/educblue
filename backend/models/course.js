const mongoose = require('mongoose');

// Define a content schema separately for better control
const contentItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    videoUrl: String, // Store S3/Cloudinary URLs later
    type: {
      type: String,
      enum: ['video', 'quiz', 'document', 'markdown', 'multipleChoice'],
      default: 'video',
      required: true,
    },
    content: String, // For markdown content
    question: {
      type: String,
      required: function () {
        return this.type === 'multipleChoice';
      },
    },
    options: {
      type: [String],
      validate: {
        validator: function (arr) {
          return (
            !this.type ||
            this.type !== 'multipleChoice' ||
            (arr && arr.length === 4)
          );
        },
        message: 'Multiple choice questions must have exactly 4 options',
      },
      required: function () {
        return this.type === 'multipleChoice';
      },
    },
    correctOption: {
      type: Number,
      min: 0,
      max: 3,
      validate: {
        validator: function (val) {
          return (
            !this.type ||
            this.type !== 'multipleChoice' ||
            (val >= 0 && val <= 3)
          );
        },
        message: 'Correct option must be between 0 and 3',
      },
      required: function () {
        return this.type === 'multipleChoice';
      },
    },
  },
  { _id: true } // Enable auto-generation of _id
);

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  markdownDescription: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
  },
  instructor: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // Duration in hours
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  content: [contentItemSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', courseSchema);
