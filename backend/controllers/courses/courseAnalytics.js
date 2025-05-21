const Course = require('../../models/course');
const Progress = require('../../models/progress');
const User = require('../../models/user'); // Import User model

/**
 * Get analytics data for a specific course
 * @route GET /api/courses/:id/analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Course analytics including completion rate, quiz statistics, total enrolled students, and active students in the last 30 days
 */
const getCourseAnalytics = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    // Handle course not found
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Ensure the requesting user is the instructor or admin
    // Assuming req.user.role is available from auth middleware
    const isAdmin = req.user.role === 'admin';
    if (req.user.fullName !== course.instructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or admin can view analytics',
      });
    }

    // Get all progress records for this course
    const progressRecords = await Progress.find({ courseId });

    // Get total enrolled students
    const totalEnrolledStudents = await User.countDocuments({
      enrolledCourses: courseId,
    });

    // Get students active (completed an item) in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeProgressRecords = await Progress.find({
      courseId,
      completedAt: { $gte: thirtyDaysAgo },
    });
    const activeStudentsLast30Days = new Set(
      activeProgressRecords.map((record) => record.userId.toString())
    ).size;

    // Get unique users who have at least one progress record for this course
    // const uniqueUserIds = [
    //   ...new Set(progressRecords.map((record) => record.userId.toString())),
    // ]; // This is no longer directly needed for completionRate denominator

    // Calculate completion rate - percentage of users with at least one completed item
    const usersWithCompletedItems = new Set();
    progressRecords.forEach((record) => {
      if (record.completed) {
        usersWithCompletedItems.add(record.userId.toString());
      }
    });

    // Calculate completion rate (with 2 decimal precision)
    // based on total enrolled students
    const completionRate =
      totalEnrolledStudents > 0
        ? parseFloat(
            (
              (usersWithCompletedItems.size / totalEnrolledStudents) *
              100
            ).toFixed(2)
          )
        : 0;

    // Find quiz/multiple-choice content items in the course
    const quizContentItems = course.content.filter(
      (item) => item.type === 'quiz' || item.type === 'multipleChoice'
    );

    // Calculate quiz statistics
    const quizStats = quizContentItems.map((quizItem) => {
      // Get all progress records for this specific content item
      const quizProgressRecords = progressRecords.filter(
        (record) => record.contentId.toString() === quizItem.id.toString()
      );

      // Calculate average score
      let averageScore = 0;
      if (quizProgressRecords.length > 0) {
        const totalScore = quizProgressRecords.reduce(
          (sum, record) => sum + record.score,
          0
        );
        averageScore = parseFloat(
          (totalScore / quizProgressRecords.length).toFixed(2)
        );
      }

      return {
        contentId: quizItem.id,
        title: quizItem.title,
        averageScore,
        submissionCount: quizProgressRecords.length,
      };
    });

    res.json({
      totalEnrolledStudents,
      activeStudentsLast30Days,
      completionRate,
      quizStats,
    });
  } catch (error) {
    // Using a non-console approach for logging errors
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.error('Error retrieving course analytics:', error);
    }
    res.status(500).json({ message: 'Server error' });
  }

  return undefined;
};

module.exports = {
  getCourseAnalytics,
};
