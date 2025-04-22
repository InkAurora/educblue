const User = require('../models/user');
const Course = require('../models/course');

exports.enroll = async (req, res) => {
  const { courseId } = req.body;

  try {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find user and check for duplicate enrollment
    const user = await User.findById(req.user.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already enrolled
    if (user.enrolledCourses.includes(courseId)) {
      return res
        .status(400)
        .json({ message: 'Already enrolled in this course' });
    }

    // Add course to user's enrolled courses
    user.enrolledCourses.push(courseId);
    await user.save();

    res.status(200).json({ message: 'Successfully enrolled in the course' });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
