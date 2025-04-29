// Import dotenv to ensure environment variables are loaded
require('dotenv').config();

// Directly access the Stripe key from process.env
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe with the secret key
const stripe = require('stripe')(stripeSecretKey);

// Debug logging to help troubleshoot
console.log('Enrollment controller - Stripe key available:', !!stripeSecretKey);

const User = require('../models/user');
const Course = require('../models/course');

exports.enroll = async (req, res) => {
  const { courseId, sessionId } = req.body;

  if (!courseId || !sessionId) {
    return res
      .status(400)
      .json({ message: 'Course ID and session ID are required' });
  }

  try {
    // Verify the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if payment is completed
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find user and check for duplicate enrollment
    const user = await User.findById(req.user.id);
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

    return res
      .status(200)
      .json({ message: 'Successfully enrolled in the course' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Enrollment error:', error);
    return res
      .status(500)
      .json({ message: 'Server error during enrollment process' });
  }
};
