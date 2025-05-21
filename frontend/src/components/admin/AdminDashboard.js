import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Divider,
  TextField, // Add TextField for search input
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import axiosInstance from '../../utils/axiosConfig';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Renamed user to currentUser to avoid conflict
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalCourses: 0,
    totalUsers: 0,
    totalInstructors: 0,
    totalStudents: 0,
    averageCompletionRate: 0,
  });
  const [courses, setCourses] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  // Fetch user data to check if admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await axiosInstance.get('/api/users/me');
        setCurrentUser(response.data); // Use setCurrentUser

        if (response.data.role !== 'admin') {
          setError('Admin access required');
          navigate('/dashboard');
        }
      } catch (err) {
        setError('Error verifying admin access');
        navigate('/login');
      }
    };

    checkAdminAccess();
  }, [navigate]);

  // Fetch all users and analytics data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!currentUser || currentUser.role !== 'admin') return; // Use currentUser

      setLoading(true);
      try {
        // Fetch all users
        const usersResponse = await axiosInstance.get('/api/users');
        setUsers(usersResponse.data);

        // Fetch analytics data
        const analyticsResponse = await axiosInstance.get('/api/analytics');
        const apiData = analyticsResponse.data;
        setAnalytics({
          totalCourses: apiData.courses?.total ?? 0,
          totalUsers: apiData.users?.total ?? 0,
          totalInstructors: apiData.users?.byRole?.instructor ?? 0,
          totalStudents: apiData.users?.byRole?.student ?? 0, // Preserving for potential use
          averageCompletionRate: apiData.engagement?.averageCompletionRate ?? 0, // Will be 0-1
        });

        // Fetch all courses for enrollment management
        const coursesResponse = await axiosInstance.get('/api/courses');
        setCourses(coursesResponse.data);

        setLoading(false);
      } catch (err) {
        setError('Failed to load admin data');
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser]); // Dependency on currentUser

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    setProcessingAction(true);
    setActionSuccess(null);

    try {
      await axiosInstance.put(`/api/users/${userId}`, { role: newRole });

      // Update users list with new role
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)), // Changed _id to id
      );

      setActionSuccess(`User role updated to ${newRole}`);
    } catch (err) {
      setError(
        `Failed to update role: ${err.response?.data?.message || 'Unknown error'}`,
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // Open enrollment dialog
  const handleOpenEnrollDialog = (userToEnroll) => {
    setSelectedUser(userToEnroll);
    // Pre-select courses the user is already enrolled in.
    // Ensure enrolledCourses is an array and map to IDs,
    // handling cases where it might contain objects with _id or just string IDs.
    const enrolledCourseIds = (userToEnroll.enrolledCourses || []).map(
      (courseOrId) => {
        if (typeof courseOrId === 'string') {
          return courseOrId;
        }
        // Check for id first, then _id as a fallback
        // eslint-disable-next-line no-underscore-dangle
        return courseOrId.id || courseOrId._id;
      },
    );
    setSelectedCourses(enrolledCourseIds.filter((id) => id != null)); // Filter out null/undefined ids
    setOpenEnrollDialog(true);
  };

  // Handle course selection in dialog
  const handleCourseToggle = (courseId) => {
    const currentIndex = selectedCourses.indexOf(courseId);
    const newSelectedCourses = [...selectedCourses];

    if (currentIndex === -1) {
      newSelectedCourses.push(courseId);
    } else {
      newSelectedCourses.splice(currentIndex, 1);
    }

    setSelectedCourses(newSelectedCourses);
  };

  // Save course enrollments
  const handleSaveEnrollments = async () => {
    if (!selectedUser) return;

    // eslint-disable-next-line no-underscore-dangle
    const userId = selectedUser.id || selectedUser._id;

    if (!userId) {
      setError('Failed to update enrollments: User ID is missing.');
      return;
    }

    setProcessingAction(true);
    try {
      await axiosInstance.put(`/api/users/${userId}`, {
        enrolledCourses: selectedCourses,
      });

      // Update users list with new enrollments
      setUsers(
        users.map((u) => {
          // eslint-disable-next-line no-underscore-dangle
          const currentUserId = u.id || u._id;
          return currentUserId === userId
            ? { ...u, enrolledCourses: selectedCourses }
            : u;
        }),
      );

      setActionSuccess('User enrollments updated');
      setOpenEnrollDialog(false);
    } catch (err) {
      setError(
        `Failed to update enrollments: ${err.response?.data?.message || 'Unknown error'}`,
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant='h6' sx={{ mt: 2 }}>
          Loading admin dashboard...
        </Typography>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button variant='contained' onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </Container>
    );
  }

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      (user.fullName &&
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      {' '}
      {/* Ensure parent Box takes full width */}
      {/* Sidebar Removed */}
      {/*
      <CourseSidebar
        title='Admin Dashboard'
        items={[
          { name: 'Analytics', icon: <AssignmentIcon /> },
          { name: 'User Management', icon: <PersonIcon /> },
          { name: 'Course Management', icon: <SchoolIcon /> },
        ]}
      />
      */}
      {/* Main content */}
      {/* Ensure main content takes full width by adjusting its container or ensuring flexGrow works as expected */}
      <Box sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Admin Dashboard
        </Typography>

        {actionSuccess && (
          <Alert
            severity='success'
            sx={{ mb: 2 }}
            onClose={() => setActionSuccess(null)}
          >
            {actionSuccess}
          </Alert>
        )}

        {/* Analytics Cards */}
        <Typography variant='h5' component='h2' gutterBottom sx={{ mt: 4 }}>
          Platform Analytics
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color='textSecondary' gutterBottom>
                  Total Courses
                </Typography>
                <Typography variant='h3'>
                  {typeof analytics.totalCourses === 'number' &&
                  !Number.isNaN(analytics.totalCourses)
                    ? analytics.totalCourses
                    : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color='textSecondary' gutterBottom>
                  Total Users
                </Typography>
                <Typography variant='h3'>
                  {typeof analytics.totalUsers === 'number' &&
                  !Number.isNaN(analytics.totalUsers)
                    ? analytics.totalUsers
                    : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color='textSecondary' gutterBottom>
                  Total Instructors
                </Typography>
                <Typography variant='h3'>
                  {typeof analytics.totalInstructors === 'number' &&
                  !Number.isNaN(analytics.totalInstructors)
                    ? analytics.totalInstructors
                    : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color='textSecondary' gutterBottom>
                  Avg. Completion Rate
                </Typography>
                <Typography variant='h3'>
                  {typeof analytics.averageCompletionRate === 'number' &&
                  !Number.isNaN(analytics.averageCompletionRate)
                    ? Math.round(analytics.averageCompletionRate * 100) // Multiply by 100
                    : 0}
                  %
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Users Table */}
        <Typography variant='h5' component='h2' gutterBottom sx={{ mt: 4 }}>
          User Management
        </Typography>
        <TextField // Add TextField for search input
          label='Search Users (Name or Email)' // Changed to single quotes
          variant='outlined' // Changed to single quotes
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label='users table'>
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Enrolled Courses</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map(
                  // Use filteredUsers instead of users
                  (tableUser) => {
                    // eslint-disable-next-line no-underscore-dangle
                    const userId = tableUser.id || tableUser._id;
                    return (
                      <TableRow key={userId} hover>
                        <TableCell>{tableUser.fullName}</TableCell>
                        <TableCell>{tableUser.email}</TableCell>
                        <TableCell>
                          <FormControl size='small' fullWidth>
                            <Select
                              value={tableUser.role || 'student'}
                              onChange={
                                (e) =>
                                  handleRoleChange(tableUser.id, e.target.value) // Changed _id to id
                              }
                              disabled={processingAction}
                            >
                              <MenuItem value='student'>Student</MenuItem>
                              <MenuItem value='instructor'>Instructor</MenuItem>
                              <MenuItem value='admin'>Admin</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          {tableUser.enrolledCourses?.length > 0 ? (
                            <Chip
                              label={`${tableUser.enrolledCourses.length} courses`}
                              color='primary'
                              variant='outlined'
                            />
                          ) : (
                            <Chip label='None' variant='outlined' />
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title='Manage Enrollments'>
                            <IconButton
                              onClick={() => handleOpenEnrollDialog(tableUser)}
                              disabled={processingAction}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Enrollment Dialog */}
        <Dialog
          open={openEnrollDialog}
          onClose={() => setOpenEnrollDialog(false)}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>
            Manage Course Enrollments for {selectedUser?.fullName}
          </DialogTitle>
          <DialogContent>
            <List>
              {courses.map((course) => {
                // Get the string ID from the course object. Prefer 'id', fallback to '_id'.
                // eslint-disable-next-line no-underscore-dangle
                const idFromCourseObject =
                  course.id || (course._id ? course._id.toString() : null);

                if (!idFromCourseObject) {
                  // Skip rendering this course if it has no ID
                  return null;
                }

                return (
                  <React.Fragment key={idFromCourseObject}>
                    <ListItem>
                      <Checkbox
                        edge='start'
                        checked={selectedCourses.includes(idFromCourseObject)}
                        onChange={() => handleCourseToggle(idFromCourseObject)}
                        disabled={processingAction}
                      />
                      <ListItemText
                        primary={course.title}
                        secondary={`Instructor: ${course.instructor}`}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEnrollDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSaveEnrollments}
              color='primary'
              disabled={processingAction}
            >
              {processingAction ? (
                <CircularProgress size={24} />
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default AdminDashboard;
