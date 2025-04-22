const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
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
  content: [
    {
      title: String,
      videoUrl: String, // Store S3/Cloudinary URLs later
      type: {
        type: String,
        enum: ['video', 'quiz', 'document'],
        default: 'video',
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', courseSchema);
