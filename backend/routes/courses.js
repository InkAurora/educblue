const express = require('express');

const router = express.Router();
const {
  getCourses,
  getCourseById,
  getCourseContents,
  getCourseSections,
  getSectionContents,
  createCourse,
  updateCourse,
  updateCourseContent,
  publishCourse,
  getCourseContentById,
  getInstructorCourses,
} = require('../controllers/courses');
const {
  updateCourseSections,
  addSection,
  updateSection,
  deleteSection,
  addContentToSection,
  updateContentInSection,
  deleteContentFromSection,
} = require('../controllers/courses/content');
const {
  getCourseAnalytics,
} = require('../controllers/courses/courseAnalytics');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const restrictTo = require('../middleware/role');

router.get('/', getCourses);
router.get(
  '/instructor',
  auth,
  restrictTo('instructor', 'admin'),
  getInstructorCourses
);
router.get('/:id', optionalAuth, getCourseById);
// Get sections for a course (without content details)
router.get('/:id/sections', auth, getCourseSections);
// Get contents of a specific section
router.get('/:id/sections/:sectionId', auth, getSectionContents);
// Get all sections and content for a course
router.get('/:id/content', auth, getCourseContents);
// Get specific content item within a section
router.get(
  '/:id/sections/:sectionId/content/:contentId',
  auth,
  getCourseContentById
);
// Add content to a specific section
router.post(
  '/:id/sections/:sectionId/content',
  auth,
  restrictTo('instructor', 'admin'),
  addContentToSection
);
// Update content in a specific section
router.put(
  '/:id/sections/:sectionId/content/:contentId',
  auth,
  restrictTo('instructor', 'admin'),
  updateContentInSection
);
// Delete content from a specific section
router.delete(
  '/:id/sections/:sectionId/content/:contentId',
  auth,
  restrictTo('instructor', 'admin'),
  deleteContentFromSection
);
// Legacy content route (deprecated)
router.get('/:id/content/:contentId', auth, (req, res) => {
  res.status(400).json({
    message:
      'This endpoint is deprecated. Please use /courses/:id/sections/:sectionId/content/:contentId to access content within sections.',
  });
});
router.get(
  '/:id/analytics',
  auth,
  restrictTo('instructor', 'admin'),
  getCourseAnalytics
);
router.post('/', auth, restrictTo('instructor', 'admin'), createCourse);
router.put('/:id', auth, restrictTo('instructor', 'admin'), updateCourse);

// Section management routes
router.put(
  '/:id/sections',
  auth,
  restrictTo('instructor', 'admin'),
  updateCourseSections
);
router.post(
  '/:id/sections',
  auth,
  restrictTo('instructor', 'admin'),
  addSection
);
router.put(
  '/:id/sections/:sectionId',
  auth,
  restrictTo('instructor', 'admin'),
  updateSection
);
router.delete(
  '/:id/sections/:sectionId',
  auth,
  restrictTo('instructor', 'admin'),
  deleteSection
);

// Legacy content route (deprecated)
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
