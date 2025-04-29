const express = require('express');

const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourseContent,
  publishCourse,
} = require('../controllers/courses');
const auth = require('../middleware/auth');
const restrictTo = require('../middleware/role');

router.get('/', getCourses);
router.get('/:id', auth, getCourseById);
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
