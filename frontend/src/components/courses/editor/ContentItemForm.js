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
  Box,
  FormHelperText,
} from '@mui/material';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import { convertMarkdownToHTML } from '../../../utils/markdownUtils';

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
        options: [],
        correctOption: 0,
      }));
    } else if (currentItem.type === 'markdown' || currentItem.type === 'quiz') {
      setCurrentItem((prev) => ({
        ...prev,
        videoUrl: '',
        content: prev.content || '',
        options: [],
        correctOption: 0,
      }));
    } else if (currentItem.type === 'multipleChoice') {
      setCurrentItem((prev) => ({
        ...prev,
        videoUrl: '',
        // Keep content for the question text
        content: prev.content || '',
        // Initialize options array if it doesn't exist
        options: prev.options || ['', '', '', ''],
        // Set default correctOption if it doesn't exist
        correctOption: prev.correctOption ?? 0,
      }));
    }
  }, [currentItem.type, setCurrentItem]);

  // Memoize the SimpleMDE options to prevent re-rendering issues
  const editorOptions = useMemo(
    () => ({
      spellChecker: false,
      placeholder: 'Write markdown content here...',
      status: ['lines', 'words'],
      previewClass: ['editor-preview'],
      autofocus: false,
      previewRender: (plainText) => {
        // Return rendered HTML or fallback to plain text
        if (!plainText || plainText.trim() === '') {
          return '<p><em>Nothing to preview</em></p>';
        }

        // Use centralized markdown conversion for consistent styling
        return convertMarkdownToHTML(plainText);
      },
    }),
    [],
  );

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

  // Handler for multiple choice option changes
  const handleOptionChange = (index, value) => {
    setCurrentItem((prevItem) => {
      const newOptions = [...prevItem.options];
      newOptions[index] = value;
      return {
        ...prevItem,
        options: newOptions,
      };
    });
  };

  // Check if all multiple choice options are filled
  const areOptionsFilled = () => {
    if (currentItem.type !== 'multipleChoice') return true;

    return (
      currentItem.options &&
      currentItem.options.length === 4 &&
      currentItem.options.every((option) => option.trim() !== '') &&
      currentItem.content &&
      currentItem.content.trim().length >= 2 // Ensure question has sufficient content
    );
  };
  return (
    <Dialog open={open} maxWidth='md' fullWidth>
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
            <MenuItem
              value='multipleChoice'
              data-testid='multiple-choice-option'
            >
              Multiple Choice Quiz
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

        {currentItem.type === 'multipleChoice' && (
          <>
            <TextField
              margin='normal'
              required
              fullWidth
              id='content'
              label='Question'
              name='content'
              value={currentItem.content}
              onChange={handleChange}
              placeholder='Enter your multiple choice question'
              inputProps={{
                'aria-label': 'Question',
                'data-testid': 'multiple-choice-question',
              }}
            />

            <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>
              Options (exactly 4 required)
            </Typography>

            {currentItem.options &&
              currentItem.options.map((option, index) => (
                <TextField
                  key={index}
                  margin='normal'
                  required
                  fullWidth
                  id={`option-${index}`}
                  label={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Enter option ${index + 1}`}
                  inputProps={{
                    'aria-label': `Option ${index + 1}`,
                    'data-testid': `multiple-choice-option-${index}`,
                  }}
                />
              ))}

            {!areOptionsFilled() && (
              <FormHelperText error>All 4 options are required</FormHelperText>
            )}

            <FormControl
              fullWidth
              margin='normal'
              required
              error={
                currentItem.correctOption < 0 || currentItem.correctOption > 3
              }
            >
              <InputLabel id='correct-option-label'>Correct Option</InputLabel>
              <Select
                labelId='correct-option-label'
                id='correctOption'
                name='correctOption'
                value={currentItem.correctOption}
                onChange={handleChange}
                label='Correct Option'
                inputProps={{
                  'aria-label': 'Correct Option',
                  'data-testid': 'multiple-choice-correct-option',
                }}
              >
                <MenuItem value={0}>Option 1</MenuItem>
                <MenuItem value={1}>Option 2</MenuItem>
                <MenuItem value={2}>Option 3</MenuItem>
                <MenuItem value={3}>Option 4</MenuItem>
              </Select>
              <FormHelperText>
                Select which option is the correct answer
              </FormHelperText>
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSave}
          variant='contained'
          color='primary'
          disabled={
            currentItem.type === 'multipleChoice' && !areOptionsFilled()
          }
        >
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
    options: PropTypes.arrayOf(PropTypes.string),
    correctOption: PropTypes.number,
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
