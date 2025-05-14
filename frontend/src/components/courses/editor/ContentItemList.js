import React from 'react';
import PropTypes from 'prop-types';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Button,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';

/**
 * Component to display and manage a list of course content items
 */
function ContentItemList({ content, onEdit, onDelete, onAdd }) {
  return (
    <Box sx={{ mt: 3 }}>
      {content.length > 0 ? (
        <List>
          {content.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText
                  primary={item.title}
                  secondary={`Type: ${item.type}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge='end'
                    aria-label='edit'
                    onClick={() => onEdit(index)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge='end'
                    aria-label='delete'
                    onClick={() => onDelete(index)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < content.length - 1 && <Divider component='li' />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity='info' sx={{ mt: 2, mb: 2 }}>
          No content added yet. Click the "Add Content" button to create your
          first content item.
        </Alert>
      )}

      <Button
        variant='outlined'
        color='primary'
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ mt: 2 }}
      >
        Add Content
      </Button>
    </Box>
  );
}

ContentItemList.propTypes = {
  content: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      videoUrl: PropTypes.string,
      content: PropTypes.string,
      question: PropTypes.string,  // Added for multiple-choice quizzes
      options: PropTypes.arrayOf(PropTypes.string),
      correctOption: PropTypes.number,
    }),
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default ContentItemList;
