// Import functionality from submodules
const {
  getCourses,
  getCourseById,
  getCourseContentById,
} = require('./courses/listing');
const {
  createCourse,
  updateCourse,
  publishCourse,
} = require('./courses/management');
const { updateCourseContent } = require('./courses/content');

// Export all functionality
module.exports = {
  // Course listing functionality
  getCourses,
  getCourseById,
  getCourseContentById,

  // Course management functionality
  createCourse,
  updateCourse,
  publishCourse,

  // Course content functionality
  updateCourseContent,
};
