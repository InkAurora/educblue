import React, { useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

function ContentItemForm({
  open,
  onClose,
  currentItem,
  setCurrentItem,
  onSave,
  error,
  isEditing,
}) {
  // Reset form when changing content type
  useEffect(() => {
    if (currentItem.type === 'video') {
      setCurrentItem((prev) => ({
        ...prev,
        content: '',
        videoUrl: prev.videoUrl || '',
      }));
    } else if (currentItem.type === 'markdown' || currentItem.type === 'quiz') {
      setCurrentItem((prev) => ({
        ...prev,
        videoUrl: '',
        content: prev.content || '',
      }));
    }
  }, [currentItem.type, setCurrentItem]);

  // Memoize the SimpleMDE options to prevent re-rendering issues
  const editorOptions = useMemo(() => {
    return {
      spellChecker: false,
      placeholder: 'Write markdown content here...',
      status: ['lines', 'words'],
      previewClass: ['editor-preview'],
      autofocus: false,
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem((prevItem) => ({
      ...prevItem,
      [name]: value,
    }));
  };

  const handleMarkdownChange = (value) => {
    setCurrentItem((prevItem) => ({
      ...prevItem,
      content: value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle id='content-dialog-title' data-testid='content-dialog-title'>
        {isEditing ? 'Edit Content Item' : 'Add Content Item'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth margin='normal'>
          <InputLabel id='content-type-label'>Content Type</InputLabel>
          <Select
            labelId='content-type-label'
            id='type'
            name='type'
            value={currentItem.type}
            onChange={handleChange}
            label='Content Type'
            inputProps={{
              'aria-label': 'Content Type',
            }}
            data-testid='content-type-select'
          >
            <MenuItem value='video' data-testid='video-option'>
              Video
            </MenuItem>
            <MenuItem value='markdown' data-testid='markdown-option'>
              Text/Markdown
            </MenuItem>
            <MenuItem value='quiz' data-testid='quiz-option'>
              Quiz
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          margin='normal'
          required
          fullWidth
          id='title'
          label='Content Title'
          name='title'
          value={currentItem.title}
          onChange={handleChange}
          inputProps={{
            'aria-label': 'Content Title',
          }}
        />

        {currentItem.type === 'video' && (
          <TextField
            margin='normal'
            required
            fullWidth
            id='videoUrl'
            label='Video URL'
            name='videoUrl'
            value={currentItem.videoUrl}
            onChange={handleChange}
            placeholder='Enter YouTube or other video embed URL'
            inputProps={{
              'aria-label': 'Video URL',
            }}
          />
        )}

        {currentItem.type === 'markdown' && (
          <>
            <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>
              Content (Markdown)
            </Typography>
            <SimpleMDE
              id='markdownEditor'
              value={currentItem.content}
              onChange={handleMarkdownChange}
              options={editorOptions}
            />
          </>
        )}

        {currentItem.type === 'quiz' && (
          <TextField
            margin='normal'
            required
            fullWidth
            multiline
            rows={4}
            id='content'
            label='Quiz Content'
            name='content'
            value={currentItem.content}
            onChange={handleChange}
            placeholder='Enter quiz questions and answers as structured text or JSON'
            inputProps={{
              'aria-label': 'Quiz Content',
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant='contained' color='primary'>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ContentItemForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentItem: PropTypes.shape({
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    videoUrl: PropTypes.string,
    content: PropTypes.string,
  }).isRequired,
  setCurrentItem: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  error: PropTypes.string,
  isEditing: PropTypes.bool.isRequired,
};

ContentItemForm.defaultProps = {
  error: '',
};

export default ContentItemForm;
