import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  Tooltip,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import axiosInstance from '../../utils/axiosConfig';

function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalCourses: 0,
    totalUsers: 0,
    totalInstructors: 0,
    totalStudents: 0,
    averageCompletionRate: 0,
  });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(true); // Manage loading state for courses
  const [coursesError, setCoursesError] = useState(null); // Manage error state for courses

  const [selectedUser, setSelectedUser] = useState(null);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [processingAction, setProcessingAction] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // New state for admin promotion confirmation
  const [openAdminConfirmDialog, setOpenAdminConfirmDialog] = useState(false);
  const [userToPromote, setUserToPromote] = useState(null);
  const [targetRole, setTargetRole] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setCoursesLoading(true); // Start loading courses
      setError(null);
      setCoursesError(null);

      try {
        const userResponse = await axiosInstance.get('/api/users/me');
        setCurrentUser(userResponse.data);

        if (userResponse.data.role !== 'admin') {
          setError('Admin access required');
          navigate('/dashboard');
          setIsLoading(false);
          setCoursesLoading(false);
          return;
        }

        const [usersResponse, analyticsResponse, coursesDataResponse] =
          await Promise.all([
            axiosInstance.get('/api/users'),
            axiosInstance.get('/api/analytics'),
            axiosInstance.get('/api/courses'),
          ]);

        setUsers(usersResponse.data);
        const apiData = analyticsResponse.data;
        setAnalytics({
          totalCourses: apiData.courses?.total ?? 0,
          totalUsers: apiData.users?.total ?? 0,
          totalInstructors: apiData.users?.byRole?.instructor ?? 0,
          totalStudents: apiData.users?.byRole?.student ?? 0,
          averageCompletionRate: apiData.engagement?.averageCompletionRate ?? 0,
        });
        setAvailableCourses(coursesDataResponse.data);
        setCoursesError(null);
      } catch (err) {
        const errorMessage = `Failed to load initial data: ${err.response?.data?.message || err.message || 'Unknown error'}`;
        setError(errorMessage);
        setCoursesError(errorMessage); // Also set coursesError if initial fetch fails broadly
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
        setCoursesLoading(false); // Finish loading courses
      }
    };

    fetchInitialData();
  }, [navigate]);

  const proceedWithRoleChange = async (userId, newRole) => {
    setError(null);
    setSuccessMessage(null);
    setProcessingAction(true);
    const userToUpdate = users.find((user) => user._id === userId);
    // This check is already here, but good to keep
    if (userToUpdate && userToUpdate.role === 'admin' && newRole !== 'admin') {
      setError('Admin accounts cannot be demoted.');
      setProcessingAction(false);
      return;
    }

    try {
      const response = await axiosInstance.put(`/api/users/${userId}`, {
        role: newRole,
      });
      setUsers(users.map((u) => (u._id === userId ? response.data.user : u)));
      setSuccessMessage('User role updated successfully.');
    } catch (err) {
      setError(
        `Failed to update role: ${err.response?.data?.message || err.message || 'Unknown error'}`,
      );
    } finally {
      setProcessingAction(false);
      setUserToPromote(null); // Clear the user to promote
      setTargetRole(null); // Clear the target role
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const userToUpdate = users.find((user) => user._id === userId);
    if (newRole === 'admin' && userToUpdate?.role !== 'admin') {
      setUserToPromote(userToUpdate);
      setTargetRole(newRole);
      setOpenAdminConfirmDialog(true);
    } else {
      // Proceed directly if not promoting to admin or demoting an admin (which is handled in proceedWithRoleChange)
      proceedWithRoleChange(userId, newRole);
    }
  };

  const handleAdminPromotionConfirm = () => {
    if (userToPromote && targetRole) {
      proceedWithRoleChange(userToPromote._id, targetRole);
    }
    setOpenAdminConfirmDialog(false);
  };

  const handleAdminPromotionCancel = () => {
    setOpenAdminConfirmDialog(false);
    setUserToPromote(null);
    setTargetRole(null);
  };

  const handleOpenEnrollDialog = (userToEnroll) => {
    setSelectedUser(userToEnroll);
    setSelectedCourses(
      userToEnroll.enrolledCourses?.map((courseOrId) =>
        typeof courseOrId === 'string' ? courseOrId : courseOrId._id,
      ) || [],
    );
    setOpenEnrollDialog(true);
    setError(null);
    setSuccessMessage(null);
  };

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

  const handleSaveEnrollments = async () => {
    if (!selectedUser || !selectedUser._id) {
      setError('No user selected for enrollment.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setProcessingAction(true);
    const userId = selectedUser._id;

    try {
      const courseIdsToEnroll = selectedCourses.map(
        (courseId) => (typeof courseId === 'string' ? courseId : courseId), // Assuming selectedCourses already holds IDs
      );
      const response = await axiosInstance.put(`/api/users/${userId}`, {
        enrolledCourses: courseIdsToEnroll,
      });
      setUsers(users.map((u) => (u._id === userId ? response.data.user : u)));
      setOpenEnrollDialog(false);
      setSelectedUser(null);
      setSuccessMessage('User enrollments updated successfully.');
    } catch (err) {
      setError(
        `Failed to update enrollments: ${err.response?.data?.message || err.message || 'Unknown error'}`,
      );
    } finally {
      setProcessingAction(false);
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant='h6' sx={{ mt: 2 }}>
          Loading admin dashboard...
        </Typography>
      </Container>
    );
  }

  if (error && (!currentUser || currentUser.role !== 'admin')) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button
          variant='contained'
          onClick={() => navigate(currentUser ? '/dashboard' : '/login')}
        >
          {currentUser ? 'Return to Dashboard' : 'Go to Login'}
        </Button>
      </Container>
    );
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.fullName &&
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Admin Dashboard
      </Typography>

      {successMessage && (
        <Alert
          severity='success'
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {error && !successMessage && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
              <Typography variant='h3'>{analytics.totalCourses}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Total Users
              </Typography>
              <Typography variant='h3'>{analytics.totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Total Instructors
              </Typography>
              <Typography variant='h3'>{analytics.totalInstructors}</Typography>
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
                {`${(analytics.averageCompletionRate * 100).toFixed(1)}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant='h5' component='h2' gutterBottom sx={{ mt: 4 }}>
        User Management
      </Typography>
      <TextField
        label='Search Users (Name or Email)'
        variant='outlined'
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label='user management table'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Enrolled Courses</TableCell>
                {/* <TableCell>Actions</TableCell> */}
                {/* Removed Actions header */}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((tableUser) => (
                <TableRow key={tableUser._id}>
                  <TableCell component='th' scope='row'>
                    <Button
                      variant='text'
                      onClick={() => navigate(`/profile/${tableUser._id}`)}
                    >
                      {tableUser.fullName}
                    </Button>
                  </TableCell>
                  <TableCell>{tableUser.email}</TableCell>
                  <TableCell>
                    <FormControl size='small' sx={{ minWidth: 120 }}>
                      <Select
                        value={tableUser.role}
                        onChange={(e) =>
                          handleRoleChange(tableUser._id, e.target.value)
                        }
                        disabled={
                          tableUser.email === currentUser?.email ||
                          tableUser.role === 'admin' ||
                          processingAction
                        }
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value='student'>Student</MenuItem>
                        <MenuItem value='instructor'>Instructor</MenuItem>
                        <MenuItem value='admin'>Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {tableUser.enrolledCourses?.length || 0}
                    <Tooltip title='Manage Enrollments'>
                      <IconButton
                        size='small'
                        onClick={() => handleOpenEnrollDialog(tableUser)}
                        disabled={processingAction}
                        sx={{ ml: 1 }}
                      >
                        <EditIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  {/* Removed empty TableCell for Actions */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={openEnrollDialog}
        onClose={() => setOpenEnrollDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Enroll User in Courses</DialogTitle>
        <DialogContent>
          {coursesLoading && <CircularProgress />}
          {!coursesLoading && coursesError && (
            <Alert severity='error'>{coursesError}</Alert>
          )}
          {!coursesLoading && !coursesError && (
            <List>
              {availableCourses.map((course) => (
                <ListItem
                  key={course._id}
                  dense
                  onClick={() => handleCourseToggle(course._id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <Checkbox
                    edge='start'
                    checked={selectedCourses.includes(course._id)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText primary={course.title} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEnrollDialog(false)} color='primary'>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEnrollments}
            color='primary'
            disabled={processingAction}
          >
            {processingAction ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Promotion Confirmation Dialog */}
      <Dialog
        open={openAdminConfirmDialog}
        onClose={handleAdminPromotionCancel}
        aria-labelledby='admin-promotion-dialog-title'
      >
        <DialogTitle id='admin-promotion-dialog-title'>
          Confirm Admin Promotion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to promote{' '}
            <strong>{userToPromote?.fullName || 'this user'}</strong> to Admin?
            This action grants significant permissions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleAdminPromotionCancel}
            color='primary'
            disabled={processingAction}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdminPromotionConfirm}
            color='error' // Use error color for potentially destructive/sensitive actions
            disabled={processingAction}
            autoFocus
          >
            {processingAction ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminDashboard;
