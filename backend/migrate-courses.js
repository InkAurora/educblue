require('dotenv').config();
const connectDB = require('./config/db');
const Course = require('./models/course');

async function migrateCourses() {
  try {
    // Connect to the database
    await connectDB();

    // Find all courses that don't have a status field set
    const coursesWithoutStatus = await Course.find({
      status: { $exists: false },
    });

    // Log found courses (using console.log for migration scripts is acceptable)
    // eslint-disable-next-line no-console
    console.log(
      `Found ${coursesWithoutStatus.length} courses without a status field.`
    );

    // Update all courses without status to 'published'
    if (coursesWithoutStatus.length > 0) {
      await Course.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'published' } }
      );
      // eslint-disable-next-line no-console
      console.log(
        `Successfully updated ${coursesWithoutStatus.length} courses to 'published' status.`
      );
    } else {
      // eslint-disable-next-line no-console
      console.log('No courses need to be updated.');
    }

    // eslint-disable-next-line no-console
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateCourses();
