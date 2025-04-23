const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Course = require('../models/course');

// Create a Stripe checkout session
const createCheckoutSession = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Find the course in the database
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/courses/${courseId}`,
      metadata: {
        courseId,
        userId: req.user.id,
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    // Log the error to server logs
    // eslint-disable-next-line no-console
    console.error('Stripe checkout error:', error);
    return res
      .status(500)
      .json({ message: 'Server error during checkout process' });
  }
};

module.exports = {
  createCheckoutSession,
};
