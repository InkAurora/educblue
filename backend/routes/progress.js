const express = require('express');

const router = express.Router();
const { getProgress, updateProgress } = require('../controllers/progress');
const auth = require('../middleware/auth');

// Get progress for a course (requires authentication)
router.get('/:courseId', auth, getProgress);

// Update progress for a specific content item (requires authentication)
router.post('/:courseId/:contentId', auth, updateProgress);

module.exports = router;
