const express = require('express');

const router = express.Router();
const { getProgress, updateProgress } = require('../controllers/progress');
const auth = require('../middleware/auth');

// Get progress for a course (requires authentication)
router.get('/:courseId', auth, getProgress);

// Update progress for a specific content item in a section (requires authentication)
router.post('/:courseId/:sectionId/:contentId', auth, updateProgress);

// Legacy route for backward compatibility (deprecated)
router.post('/:courseId/:contentId', auth, (req, res) => {
  res.status(400).json({
    message:
      'This endpoint is deprecated. Please use /progress/:courseId/:sectionId/:contentId to update progress within sections.',
  });
});

module.exports = router;
