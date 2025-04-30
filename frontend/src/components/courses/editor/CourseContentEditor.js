import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';

import ContentItemList from './ContentItemList';
import ContentItemForm from './ContentItemForm';
import useCourseContent from '../../../hooks/useCourseContent';

function CourseContentEditor() {
  const { id } = useParams();

  // Use our custom hook for course content operations
  const {
    course,
    content,
    setContent,
    loading,
    error,
    setError,
    savingContent,
    publishing,
    saveContent,
    publishCourse,
  } = useCourseContent(id);

  // Local state for the dialog and form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    type: 'video',
    title: '',
    videoUrl: '',
    content: '',
  });
  const [editIndex, setEditIndex] = useState(-1);

  const validateContentItem = () => {
    if (!currentItem.title.trim()) {
      setError('Title is required');
      return false;
    }

    if (currentItem.type === 'video' && !currentItem.videoUrl.trim()) {
      setError('Video URL is required');
      return false;
    }

    if (
      (currentItem.type === 'markdown' || currentItem.type === 'quiz') &&
      !currentItem.content.trim()
    ) {
      setError(`Content is required for ${currentItem.type} items`);
      return false;
    }

    return true;
  };

  const handleOpenDialog = (index = -1) => {
    if (index >= 0) {
      // Edit existing item
      setCurrentItem(content[index]);
      setEditIndex(index);
    } else {
      // Add new item
      setCurrentItem({
        type: 'video',
        title: '',
        videoUrl: '',
        content: '',
      });
      setEditIndex(-1);
    }
    setDialogOpen(true);
    setError(''); // Clear any previous errors
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError('');
  };

  const handleSaveItem = () => {
    if (!validateContentItem()) {
      return;
    }

    const newContent = [...content];

    if (editIndex >= 0) {
      // Update existing item
      newContent[editIndex] = currentItem;
    } else {
      // Add new item
      newContent.push(currentItem);
    }

    setContent(newContent);
    handleCloseDialog();
  };

  const handleDeleteItem = (index) => {
    const newContent = content.filter((_, i) => i !== index);
    setContent(newContent);
  };

  if (loading) {
    return (
      <Container maxWidth='md'>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth='md'>
      <Box
        sx={{
          mt: 8,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component='h1' variant='h5' align='center' gutterBottom>
            {course ? `Add Content: ${course.title}` : 'Add Course Content'}
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }} data-testid='error-alert'>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant='h6' gutterBottom>
              Course Content
            </Typography>

            <ContentItemList
              content={content}
              onEdit={handleOpenDialog}
              onDelete={handleDeleteItem}
              onAdd={() => handleOpenDialog()}
            />

            <Box
              sx={{
                mt: 3,
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <Button
                variant='contained'
                color='primary'
                onClick={saveContent}
                disabled={savingContent || content.length === 0}
              >
                {savingContent ? (
                  <CircularProgress size={24} />
                ) : (
                  'Save Content'
                )}
              </Button>

              <Button
                variant='contained'
                color='secondary'
                onClick={publishCourse}
                disabled={publishing || content.length === 0}
              >
                {publishing ? <CircularProgress size={24} /> : 'Publish Course'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Dialog for adding/editing content items */}
      <ContentItemForm
        open={dialogOpen}
        onClose={handleCloseDialog}
        currentItem={currentItem}
        setCurrentItem={setCurrentItem}
        onSave={handleSaveItem}
        error={error}
        isEditing={editIndex >= 0}
      />
    </Container>
  );
}

export default CourseContentEditor;
