const Course = require('../../models/course');
const User = require('../../models/user');

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    // Only return basic course information, no sections/content for public access
    const courses = await Course.find(
      { status: 'published' },
      {
        // Use only exclusion to avoid the projection error
        sections: 0,
        content: 0,
      }
    ).populate('instructor', 'fullName email');

    res.json(courses);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in getCourses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    // Fetch the course
    const course = await Course.findById(req.params.id).populate(
      'instructor',
      'fullName email'
    );
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // If authenticated user, check enrollment, instructor, or admin to show full details
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        const isInstructor =
          course.instructor &&
          course.instructor.toString() === user._id.toString();
        const isEnrolled = user.enrolledCourses.includes(req.params.id);
        const isAdmin = user.role === 'admin';

        if (isInstructor || isEnrolled || isAdmin) {
          return res.json(course);
        }
      }
    }

    // Public or non-enrolled user: return limited course information without sections
    const limitedCourse = {
      // eslint-disable-next-line no-underscore-dangle
      _id: course._id,
      title: course.title,
      description: course.description,
      markdownDescription: course.markdownDescription,
      price: course.price,
      instructor: course.instructor,
      duration: course.duration,
      status: course.status,
    };
    return res.json(limitedCourse);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get course content by ID within a section
exports.getCourseContentById = async (req, res) => {
  try {
    const { id, sectionId, contentId } = req.params;

    // Check if user exists in the request (set by auth middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the user to check enrollment status
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is the course instructor or is enrolled in the course
    const isInstructor =
      course.instructor && course.instructor.toString() === user._id.toString();
    const isEnrolled = user.enrolledCourses.includes(id);
    const isAdmin = user.role === 'admin'; // Check if user is admin

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Not enrolled in this course and not an admin' });
    }

    // Find the specific section
    const section = (course.sections || []).find(
      (sect) => sect.id.toString() === sectionId
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Find the specific content item within the section
    const contentItem = (section.content || []).find(
      (item) => item.id.toString() === contentId
    );

    if (!contentItem) {
      return res.status(404).json({ message: 'Content not found' });
    }

    return res.json(contentItem);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all sections and their content items for a course
exports.getCourseContents = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure the user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify the user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access: instructor, enrolled student, or admin
    const isInstructor =
      course.instructor && course.instructor.toString() === user._id.toString();
    const isEnrolled = user.enrolledCourses.includes(id);
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Not enrolled in this course and not an admin' });
    }

    // Return sections with content summary
    const sectionsSummary = (course.sections || []).map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      content: (section.content || []).map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        order: item.order,
      })),
    }));

    return res.json(sectionsSummary);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get course sections (without content details)
exports.getCourseSections = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure the user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify the user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access: instructor, enrolled student, or admin
    const isInstructor =
      course.instructor && course.instructor.toString() === user._id.toString();
    const isEnrolled = user.enrolledCourses.includes(id);
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Not enrolled in this course and not an admin' });
    }

    // Return sections without content details
    const sections = (course.sections || []).map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      contentCount: (section.content || []).length,
    }));

    return res.json(sections);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get contents of a specific section
exports.getSectionContents = async (req, res) => {
  try {
    const { id, sectionId } = req.params;

    // Ensure the user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify the user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access: instructor, enrolled student, or admin
    const isInstructor =
      course.instructor && course.instructor.toString() === user._id.toString();
    const isEnrolled = user.enrolledCourses.includes(id);
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Not enrolled in this course and not an admin' });
    }

    // Find the specific section
    const section = (course.sections || []).find(
      (sect) => sect.id.toString() === sectionId
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Return section with its content details
    const sectionWithContent = {
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      content: (section.content || []).map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        description: item.description,
        order: item.order,
        duration: item.duration,
        url: item.url,
        content: item.content,
        questions: item.questions,
      })),
    };

    return res.json(sectionWithContent);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all courses created by the instructor making the request
exports.getInstructorCourses = async (req, res) => {
  try {
    // Check if user exists in the request (set by auth middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find the user to check their role
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is an instructor or admin
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return res.status(403).json({
        message:
          'Access denied. Only instructors and admins can access this endpoint.',
      });
    }

    // Find all courses created by this instructor (including drafts)
    const courses = await Course.find({ instructor: user._id }).populate(
      'instructor',
      'fullName email'
    );

    // Return courses with full details since this is the instructor's own courses
    return res.json({
      message: 'Instructor courses retrieved successfully',
      courses,
      totalCourses: courses.length,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in getInstructorCourses:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};
