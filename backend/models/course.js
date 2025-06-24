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
      required() {
        return this.type === 'multipleChoice';
      },
    },
    options: {
      type: [String],
      validate: {
        validator(arr) {
          return (
            !this.type ||
            this.type !== 'multipleChoice' ||
            (arr && arr.length === 4)
          );
        },
        message: 'Multiple choice questions must have exactly 4 options',
      },
      required() {
        return this.type === 'multipleChoice';
      },
    },
    correctOption: {
      type: Number,
      min: 0,
      max: 3,
      validate: {
        validator(val) {
          return (
            !this.type ||
            this.type !== 'multipleChoice' ||
            (val >= 0 && val <= 3)
          );
        },
        message: 'Correct option must be between 0 and 3',
      },
      required() {
        return this.type === 'multipleChoice';
      },
    },
  },
  { _id: true } // Enable auto-generation of _id
);

// Define a section schema that contains multiple content items
const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    content: [contentItemSchema], // Array of content items within this section
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  sections: [sectionSchema], // Use sections instead of direct content
  // Keep content for backward compatibility but deprecate it
  content: {
    type: [contentItemSchema],
    default: undefined,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', courseSchema);
