const User = require('../models/user');
const Course = require('../models/course');
const Progress = require('../models/progress');

/**
 * Get global platform analytics - Admin only
 * @route GET /api/analytics
 * @access Admin
 */
exports.getGlobalAnalytics = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Get total courses count and other course metrics
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({
      status: 'published',
    });
    const draftCourses = await Course.countDocuments({ status: 'draft' });

    // Get average course completion rate across all courses
    const progressStats = await Progress.aggregate([
      {
        $group: {
          _id: null,
          averageCompletion: { $avg: '$completionPercentage' },
          count: { $sum: 1 },
        },
      },
    ]);

    const averageCompletionRate =
      progressStats.length > 0 ? progressStats[0].averageCompletion : 0;

    // Format the role data into a more readable format
    const formattedUsersByRole = {};
    usersByRole.forEach((role) => {
      formattedUsersByRole[role._id || 'unknown'] = role.count;
    });

    return res.json({
      users: {
        total: totalUsers,
        byRole: formattedUsersByRole,
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: draftCourses,
      },
      engagement: {
        averageCompletionRate,
        totalProgressEntries:
          progressStats.length > 0 ? progressStats[0].count : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user activity analytics - Admin only
 * @route GET /api/analytics/users
 * @access Admin
 */
exports.getUserAnalytics = async (req, res) => {
  try {
    // Get monthly user growth (signups per month)
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Get course completion rate
    const completionStats = await Progress.aggregate([
      {
        $group: {
          _id: '$courseId',
          totalCompletedLessons: {
            $sum: { $size: { $ifNull: ['$completedLessons', []] } },
          },
          totalUsers: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $project: {
          courseId: '$_id',
          title: '$course.title',
          totalCompletedLessons: 1,
          totalUsers: 1,
          totalLessons: { $size: { $ifNull: ['$course.content', []] } },
          averageCompletion: {
            $cond: [
              { $eq: [{ $size: { $ifNull: ['$course.content', []] } }, 0] },
              0,
              {
                $divide: [
                  '$totalCompletedLessons',
                  {
                    $multiply: [
                      { $size: { $ifNull: ['$course.content', []] } },
                      '$totalUsers',
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ]);

    return res.json({
      userGrowth,
      completionStats,
    });
  } catch (error) {
    // console.error('Error fetching user analytics:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get financial analytics - Admin only
 * @route GET /api/analytics/financial
 * @access Admin
 */
exports.getFinancialAnalytics = async (req, res) => {
  try {
    // This would typically connect to your payment processor (e.g., Stripe)
    // to get actual revenue data. Here we'll create a placeholder.

    const mockRevenueData = [
      { month: 'Jan', revenue: 12500 },
      { month: 'Feb', revenue: 14200 },
      { month: 'Mar', revenue: 16800 },
      { month: 'Apr', revenue: 19300 },
      { month: 'May', revenue: 17500 },
      { month: 'Jun', revenue: 21200 },
    ];

    // Get course purchase stats
    const courseRevenue = await Course.aggregate([
      { $match: { price: { $gt: 0 } } },
      {
        $project: {
          title: 1,
          price: 1,
          enrollmentCount: { $size: { $ifNull: ['$enrolledStudents', []] } },
          estimatedRevenue: {
            $multiply: [
              '$price',
              { $size: { $ifNull: ['$enrolledStudents', []] } },
            ],
          },
        },
      },
      { $sort: { estimatedRevenue: -1 } },
    ]);

    return res.json({
      revenueOverTime: mockRevenueData,
      courseRevenue,
      totalEstimatedRevenue: courseRevenue.reduce(
        (acc, course) => acc + course.estimatedRevenue,
        0
      ),
    });
  } catch (error) {
    // console.error('Error fetching financial analytics:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
