const Course = require('../models/course');

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a course (for instructors)
exports.createCourse = async (req, res) => {
  const { title, description, price, instructor, duration, content } = req.body;
  try {
    const course = new Course({
      title,
      description,
      price,
      instructor,
      duration,
      content,
    });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
};
