const Progress = require('../models/progress');

// Get progress for a specific course
exports.getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const progressRecords = await Progress.find({ userId, courseId });

    if (!progressRecords || progressRecords.length === 0) {
      return res
        .status(404)
        .json({ message: 'No progress found for this course' });
    }

    return res.json(progressRecords);
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

// Update progress for a specific content item in a course
exports.updateProgress = async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const userId = req.user.id;

    if (!contentId) {
      return res.status(400).json({ message: 'Content ID is required' });
    }

    // Find and update or create new progress record
    const updatedProgress = await Progress.findOneAndUpdate(
      { userId, courseId, contentId },
      {
        userId,
        courseId,
        contentId,
        completed: true,
        completedAt: new Date(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json(updatedProgress);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid content ID format' });
    }
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};
