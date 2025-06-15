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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import { Add, Edit as EditIcon } from '@mui/icons-material';

import ContentItemList from './ContentItemList';
import ContentItemForm from './ContentItemForm';
import axiosInstance from '../../../utils/axiosConfig';

function CourseContentEditor() {
  const { id } = useParams();

  // Local state management (replacing useCourseContent hook)
  const [course, setCourse] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Local state for the dialog and form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    type: 'video',
    title: '',
    videoUrl: '',
    content: '',
  });
  const [editIndex, setEditIndex] = useState(-1);

  // Section management state
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null); // null = create mode, id = edit mode
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(-1);

  // Section management functions - defined early to avoid hoisting issues
  const fetchSectionContent = async () => {
    if (!selectedSection) {
      setContent([]);
      return;
    }

    try {
      // Fetch the complete section data including its content
      const response = await axiosInstance.get(
        `/api/courses/${id}/sections/${selectedSection}`,
      );
      const sectionData = response.data;
      // Set the content from the section's content array
      setContent(sectionData.content || []);
    } catch (err) {
      // Failed to fetch section content, start with empty array
      setContent([]);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) {
      setError('Section title is required');
      return;
    }

    try {
      const response = await axiosInstance.post(`/api/courses/${id}/sections`, {
        title: newSectionTitle.trim(),
        description: newSectionDescription.trim(),
        order: sections.length + 1,
      });

      // Use the complete sections array from the response
      const updatedSections = response.data.course?.sections || [];
      // Normalize the data structure to match the expected format (id instead of _id)
      const normalizedSections = updatedSections.map((section) => ({
        ...section,
        id: section._id || section.id,
      }));
      setSections(normalizedSections);
      
      // Set the newly created section as selected
      if (response.data.newSectionId) {
        setSelectedSection(response.data.newSectionId);
      }
      
      setNewSectionTitle('');
      setNewSectionDescription('');
      setSectionDialogOpen(false);
      setError('');
    } catch (err) {
      setError('Failed to create section. Please try again.');
    }
  };

  const handleUpdateSection = async () => {
    if (!newSectionTitle.trim()) {
      setError('Section title is required');
      return;
    }

    if (!editingSectionId) {
      setError('No section selected for editing');
      return;
    }

    try {
      await axiosInstance.put(
        `/api/courses/${id}/sections/${editingSectionId}`,
        {
          title: newSectionTitle.trim(),
          description: newSectionDescription.trim(),
        },
      );

      // Update the sections list with the updated section
      const updatedSections = sections.map((section) =>
        section.id === editingSectionId
          ? {
              ...section,
              title: newSectionTitle.trim(),
              description: newSectionDescription.trim(),
            }
          : section,
      );
      setSections(updatedSections);
      
      setNewSectionTitle('');
      setNewSectionDescription('');
      setEditingSectionId(null);
      setSectionDialogOpen(false);
      setError('');
    } catch (err) {
      setError('Failed to update section. Please try again.');
    }
  };

  const handleDeleteSection = async () => {
    if (!editingSectionId) {
      setError('No section selected for deletion');
      return;
    }

    // If confirmation field is not shown yet, show it
    if (!showDeleteConfirmation) {
      setShowDeleteConfirmation(true);
      return;
    }

    // Check if user typed "OK" in the confirmation field
    if (deleteConfirmationText.trim() !== 'OK') {
      setError('Please type "OK" to confirm deletion');
      return;
    }

    try {
      await axiosInstance.delete(
        `/api/courses/${id}/sections/${editingSectionId}`,
      );

      // Remove the section from the list
      const updatedSections = sections.filter(
        (section) => section.id !== editingSectionId,
      );
      setSections(updatedSections);
      
      // Clear selected section if it was the deleted one
      if (selectedSection === editingSectionId) {
        setSelectedSection(
          updatedSections.length > 0 ? updatedSections[0].id : '',
        );
      }
      
      setNewSectionTitle('');
      setNewSectionDescription('');
      setEditingSectionId(null);
      setSectionDialogOpen(false);
      setShowDeleteConfirmation(false);
      setDeleteConfirmationText('');
      setError('');
    } catch (err) {
      setError('Failed to delete section. Please try again.');
    }
  };

  const handleCloseSectionDialog = () => {
    setSectionDialogOpen(false);
    setNewSectionTitle('');
    setNewSectionDescription('');
    setEditingSectionId(null);
    setShowDeleteConfirmation(false);
    setDeleteConfirmationText('');
    setError('');
  };

  const handleSectionDialogSubmit = () => {
    if (editingSectionId) {
      handleUpdateSection();
    } else {
      handleCreateSection();
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axiosInstance.get(`/api/courses/${id}/sections`);
      const courseSections = response.data || [];
      setSections(courseSections);
      // Set first section as default if available
      if (courseSections.length > 0 && !selectedSection) {
        setSelectedSection(courseSections[0].id);
      }
    } catch (err) {
      // Failed to fetch sections, start with empty array for new courses
      setSections([]);
    }
  };

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

    if (currentItem.type === 'multipleChoice') {
      // Check that question content is provided
      if (!currentItem.content.trim()) {
        setError('Question is required for multiple-choice quiz');
        return false;
      }

      // Check that we have exactly 4 options
      if (!currentItem.options || currentItem.options.length !== 4) {
        setError('Multiple-choice quiz must have exactly 4 options');
        return false;
      }

      // Check that all options have content
      if (currentItem.options.some((option) => !option.trim())) {
        setError('All multiple-choice options must have content');
        return false;
      }

      // Check that correctOption is within valid range
      if (currentItem.correctOption < 0 || currentItem.correctOption > 3) {
        setError('Correct option must be between 1 and 4');
        return false;
      }
    }

    return true;
  };

  const handleOpenDialog = (index = -1) => {
    if (index >= 0) {
      // Edit existing item
      const itemToEdit = content[index];

      // If it's a multiple-choice quiz, map 'question' to 'content' for the form
      if (itemToEdit.type === 'multipleChoice' && itemToEdit.question) {
        setCurrentItem({
          ...itemToEdit,
          content: itemToEdit.question, // Map question field to content for editing
        });
      } else {
        setCurrentItem(itemToEdit);
      }
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
    // Check if a section is selected before saving content
    if (!selectedSection) {
      setError('Please select a section before adding content');
      return;
    }

    if (!validateContentItem()) {
      return;
    }

    // Special validation for multiple-choice quizzes
    if (currentItem.type === 'multipleChoice') {
      // Verify question has sufficient content
      if (!currentItem.content || currentItem.content.trim().length < 3) {
        setError('Multiple-choice question text must be at least 3 characters');
        return;
      }

      // Verify we have exactly 4 options
      if (
        !Array.isArray(currentItem.options) ||
        currentItem.options.length !== 4
      ) {
        setError('Multiple-choice quiz must have exactly 4 options');
        return;
      }

      // Verify all options have content
      if (
        currentItem.options.some((option) => !option || option.trim() === '')
      ) {
        setError('All multiple-choice options must have content');
        return;
      }

      // Verify correctOption is valid
      if (
        typeof currentItem.correctOption !== 'number' ||
        currentItem.correctOption < 0 ||
        currentItem.correctOption > 3
      ) {
        setError('Correct option must be between 0 and 3');
        return;
      }
    }

    // Create a standardized content item based on the type
    let standardizedItem;

    if (currentItem.type === 'multipleChoice') {
      // For multiple-choice quizzes, structure exactly as backend expects
      standardizedItem = {
        type: currentItem.type,
        title: currentItem.title,
        question: currentItem.content, // Use content as the question
        options: currentItem.options, // Include all 4 options
        correctOption: currentItem.correctOption,
      };
    } else if (currentItem.type === 'video') {
      // For video content, include videoUrl field
      standardizedItem = {
        type: currentItem.type,
        title: currentItem.title,
        videoUrl: currentItem.videoUrl,
      };
    } else {
      // For all other types (markdown, text, etc.), include content field
      standardizedItem = {
        type: currentItem.type,
        title: currentItem.title,
        content: currentItem.content,
      };
    }

    // Save content to the selected section using new API endpoints
    const saveContentToSection = async () => {
      try {
        const contentId = currentItem._id || currentItem.id;
        if (editIndex >= 0 && contentId) {
          // Update existing content item
          const response = await axiosInstance.put(
            `/api/courses/${id}/sections/${selectedSection}/content/${contentId}`,
            standardizedItem,
          );
          // Update the existing item in the content list
          const updatedContent = [...content];
          updatedContent[editIndex] = response.data.content || standardizedItem;
          setContent(updatedContent);
        } else {
          // Add new content item
          const response = await axiosInstance.post(
            `/api/courses/${id}/sections/${selectedSection}/content`,
            standardizedItem,
          );
          // Add the new content item to the list using response data
          const newContentItem = response.data.content || standardizedItem;
          setContent([...content, newContentItem]);
        }
        
        handleCloseDialog();
      } catch (err) {
        setError('Failed to save content. Please try again.');
      }
    };

    saveContentToSection();
  };

  const handleDeleteItem = (index) => {
    const item = content[index];
    setItemToDelete(item);
    setDeleteIndex(index);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const contentId = itemToDelete._id || itemToDelete.id;
    
    if (!contentId) {
      // If no ID, just remove from local state
      const newContent = content.filter((_, i) => i !== deleteIndex);
      setContent(newContent);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteIndex(-1);
      return;
    }

    try {
      await axiosInstance.delete(
        `/api/courses/${id}/sections/${selectedSection}/content/${contentId}`,
      );
      // Remove from local content list
      const newContent = content.filter((_, i) => i !== deleteIndex);
      setContent(newContent);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteIndex(-1);
    } catch (err) {
      setError('Failed to delete content item. Please try again.');
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
    setDeleteIndex(-1);
  };

  // Course and content management functions
  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/courses/${id}`);
      setCourse(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load course. Please try again.');
      setLoading(false);
    }
  };

  const publishCourse = async () => {
    if (content.length === 0) {
      setError('Please add content before publishing');
      return;
    }

    try {
      setPublishing(true);
      await axiosInstance.patch(`/api/courses/${id}/publish`, {
        status: 'published',
      });
      // Navigate to published course or show success message
    } catch (err) {
      setError('Failed to publish course. Please try again.');
      setPublishing(false);
    }
  };

  // Fetch course data when component loads
  React.useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  // Fetch sections when component loads
  React.useEffect(() => {
    if (id) {
      fetchSections();
    }
  }, [id]);

  // Fetch section content when selected section changes
  React.useEffect(() => {
    if (selectedSection) {
      fetchSectionContent();
    }
  }, [selectedSection]);

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

          {successMessage && (
            <Alert
              severity='success'
              sx={{ mb: 2 }}
              data-testid='success-alert'
            >
              {successMessage}
            </Alert>
          )}

          {/* Section Management */}
          <Box sx={{ mb: 3 }}>
            <Typography variant='h6' gutterBottom>
              Course Sections
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Select Section</InputLabel>
                <Select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  label='Select Section'
                >
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <IconButton
                color='primary'
                onClick={() => {
                  setEditingSectionId(null);
                  setNewSectionTitle('');
                  setNewSectionDescription('');
                  setSectionDialogOpen(true);
                }}
                title='Add New Section'
              >
                <Add />
              </IconButton>
              
              <IconButton
                color='primary'
                onClick={() => {
                  const sectionToEdit = sections.find(
                    (s) => s.id === selectedSection,
                  );
                  if (sectionToEdit) {
                    setEditingSectionId(selectedSection);
                    setNewSectionTitle(sectionToEdit.title);
                    setNewSectionDescription(sectionToEdit.description || '');
                    setSectionDialogOpen(true);
                  }
                }}
                title='Edit Selected Section'
                disabled={!selectedSection}
              >
                <EditIcon />
              </IconButton>
            </Box>

            {sections.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {sections.map((section) => (
                  <Chip
                    key={section.id}
                    label={section.title}
                    variant={
                      selectedSection === section.id ? 'filled' : 'outlined'
                    }
                    onClick={() => setSelectedSection(section.id)}
                  />
                ))}
              </Box>
            )}

            <Divider sx={{ mt: 2 }} />
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant='h6' gutterBottom>
              {selectedSection &&
              sections.find((s) => s._id === selectedSection)
                ? `Content for "${
                    sections.find((s) => s._id === selectedSection).title
                  }" Section`
                : 'Course Content'}
            </Typography>

            {!selectedSection && sections.length > 0 && (
              <Alert severity='info' sx={{ mb: 2 }}>
                Please select a section to add content to it.
              </Alert>
            )}

            {selectedSection && (
              <ContentItemList
                content={content}
                onEdit={handleOpenDialog}
                onDelete={handleDeleteItem}
                onAdd={() => handleOpenDialog()}
              />
            )}

            <Box
              sx={{
                mt: 3,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
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

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &ldquo;{itemToDelete?.title}&rdquo;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} variant='contained' color='error'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for creating/editing sections */}
      <Dialog
        open={sectionDialogOpen}
        onClose={handleCloseSectionDialog}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {editingSectionId ? 'Edit Section' : 'Create New Section'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Section Title'
            fullWidth
            variant='outlined'
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin='dense'
            label='Section Description (Optional)'
            fullWidth
            multiline
            rows={3}
            variant='outlined'
            value={newSectionDescription}
            onChange={(e) => setNewSectionDescription(e.target.value)}
            sx={{ mb: showDeleteConfirmation ? 2 : 0 }}
          />
          {showDeleteConfirmation && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography
                variant='body2'
                color='error.contrastText'
                sx={{ mb: 1 }}
              >
                This action cannot be undone. Type &quot;OK&quot; to confirm
                deletion:
              </Typography>
              <TextField
                fullWidth
                variant='outlined'
                placeholder='Type "OK" to confirm'
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                size='small'
                sx={{ bgcolor: 'background.paper' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {editingSectionId && (
            <Button
              onClick={handleDeleteSection}
              color='error'
              variant='outlined'
              sx={{ mr: 'auto' }}
            >
              {showDeleteConfirmation ? 'Confirm Delete' : 'Delete Section'}
            </Button>
          )}
          <Button onClick={handleCloseSectionDialog}>Cancel</Button>
          <Button onClick={handleSectionDialogSubmit} variant='contained'>
            {editingSectionId ? 'Update Section' : 'Create Section'}
          </Button>
        </DialogActions>
      </Dialog>

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
