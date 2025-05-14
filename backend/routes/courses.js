const express = require('express');

const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourseContent,
  publishCourse,
  getCourseContentById,
} = require('../controllers/courses');
const {
  getCourseAnalytics,
} = require('../controllers/courses/courseAnalytics');
const auth = require('../middleware/auth');
const restrictTo = require('../middleware/role');

router.get('/', getCourses);
router.get('/:id', auth, getCourseById);
router.get('/:id/content/:contentId', auth, getCourseContentById);
router.get(
  '/:id/analytics',
  auth,
  restrictTo('instructor', 'admin'),
  getCourseAnalytics
);
router.post('/', auth, restrictTo('instructor', 'admin'), createCourse);
router.put(
  '/:id/content',
  auth,
  restrictTo('instructor', 'admin'),
  updateCourseContent
);
router.patch(
  '/:id/publish',
  auth,
  restrictTo('instructor', 'admin'),
  publishCourse
);

module.exports = router;
