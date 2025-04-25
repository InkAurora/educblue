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
  content: [
    {
      title: String,
      videoUrl: String, // Store S3/Cloudinary URLs later
      type: {
        type: String,
        enum: ['video', 'quiz', 'document', 'markdown'],
        default: 'video',
      },
      content: String, // For markdown content
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', courseSchema);
