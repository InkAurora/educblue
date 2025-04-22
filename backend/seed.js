/**
 * Seed script for EducBlue database
 *
 * INSTRUCTIONS:
 *
 * 1. Run the seed script:
 *    npm run seed
 *
 * 2. Verify data in MongoDB:
 *    - Open MongoDB Compass or Atlas UI
 *    - Connect to your database (check MONGO_URI in .env)
 *    - Check 'users' collection - should see 2 users:
 *      - student@example.com (role: student)
 *      - instructor@example.com (role: instructor)
 *    - Check 'courses' collection - should see 3 courses:
 *      - JavaScript Basics ($49.99)
 *      - Web Development with Node.js ($79.99)
 *      - React for Beginners ($69.99)
 *
 * 3. Test API endpoints:
 *
 *    a) Login with seeded user:
 *       curl -X POST http://localhost:3000/api/auth/login \
 *         -H "Content-Type: application/json" \
 *         -d '{"email": "student@example.com", "password": "password123"}'
 *
 *       # Save the token from response for next requests
 *
 *    b) Get all courses:
 *       curl http://localhost:3000/api/courses
 *
 *    Or using Postman:
 *    - POST http://localhost:3000/api/auth/login
 *      Body: { "email": "student@example.com", "password": "password123" }
 *    - GET http://localhost:3000/api/courses
 *
 * Note: Make sure the backend server is running (npm start) before testing the API endpoints
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/user');
const Course = require('./models/course');

// Sample courses data
const coursesData = [
  {
    title: 'JavaScript Basics',
    description:
      'Learn the fundamentals of JavaScript programming, including variables, functions, objects, and DOM manipulation.',
    price: 49.99,
    instructor: 'John Smith',
    duration: 8,
    content: [
      {
        title: 'Introduction to JavaScript',
        videoUrl: 'https://example.com/videos/js-intro',
        type: 'video',
      },
    ],
  },
  {
    title: 'Web Development with Node.js',
    description:
      'Master server-side JavaScript development with Node.js. Build REST APIs and web applications.',
    price: 79.99,
    instructor: 'Sarah Johnson',
    duration: 12,
    content: [
      {
        title: 'Getting Started with Node.js',
        videoUrl: 'https://example.com/videos/node-intro',
        type: 'video',
      },
    ],
  },
  {
    title: 'React for Beginners',
    description:
      'Learn React from scratch. Build modern user interfaces with the most popular frontend library.',
    price: 69.99,
    instructor: 'Mike Davis',
    duration: 10,
    content: [
      {
        title: 'React Fundamentals',
        videoUrl: 'https://example.com/videos/react-basics',
        type: 'video',
      },
    ],
  },
];

// Sample users data
const usersData = [
  {
    email: 'student@example.com',
    password: 'password123',
    role: 'student',
    enrolledCourses: [],
  },
  {
    email: 'instructor@example.com',
    password: 'instructor456',
    role: 'instructor',
    enrolledCourses: [],
  },
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    console.log('Cleared existing data');

    // Insert courses
    await Course.insertMany(coursesData);
    console.log('Courses seeded successfully');

    // Hash passwords and insert users
    const hashedUsers = await Promise.all(
      usersData.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword,
        };
      })
    );

    await User.insertMany(hashedUsers);
    console.log('Users seeded successfully');

    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
