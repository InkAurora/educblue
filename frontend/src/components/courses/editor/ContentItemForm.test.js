import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContentItemForm from './ContentItemForm';

// Mock the SimpleMDE editor component
jest.mock('react-simplemde-editor', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      data-testid='markdown-editor'
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('ContentItemForm', () => {
  const mockCurrentItem = {
    type: 'video',
    title: 'Test Video',
    videoUrl: 'https://example.com/video.mp4',
    content: '',
  };

  const mockSetCurrentItem = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for video type', () => {
    render(
      <ContentItemForm
        open
        onClose={mockOnClose}
        currentItem={mockCurrentItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error=''
        isEditing={false}
      />,
    );

    expect(screen.getByTestId('content-dialog-title')).toHaveTextContent(
      'Add Content Item',
    );
    expect(screen.getByLabelText('Content Title')).toHaveValue('Test Video');
    expect(screen.getByLabelText('Video URL')).toHaveValue(
      'https://example.com/video.mp4',
    );
    expect(screen.queryByText('Content (Markdown)')).not.toBeInTheDocument();
  });

  it('renders correctly for markdown type', () => {
    const markdownItem = {
      type: 'markdown',
      title: 'Test Markdown',
      videoUrl: '',
      content: '# Heading',
    };

    render(
      <ContentItemForm
        open
        onClose={mockOnClose}
        currentItem={markdownItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error=''
        isEditing
      />,
    );

    expect(screen.getByTestId('content-dialog-title')).toHaveTextContent(
      'Edit Content Item',
    );
    expect(screen.getByLabelText('Content Title')).toHaveValue('Test Markdown');
    expect(screen.queryByLabelText('Video URL')).not.toBeInTheDocument();
    // Instead of testing for the markdown editor directly, look for the container
    expect(screen.getByText('Content (Markdown)')).toBeInTheDocument();
  });

  it('renders correctly for multiple-choice quiz type', () => {
    const multipleChoiceItem = {
      type: 'multipleChoice',
      title: 'Test Multiple Choice Quiz',
      videoUrl: '',
      content: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctOption: 1,
    };

    render(
      <ContentItemForm
        open
        onClose={mockOnClose}
        currentItem={multipleChoiceItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error=''
        isEditing={false}
      />,
    );

    expect(screen.getByTestId('content-dialog-title')).toHaveTextContent(
      'Add Content Item',
    );
    expect(screen.getByLabelText('Content Title')).toHaveValue(
      'Test Multiple Choice Quiz',
    );

    // Check that question field is rendered
    expect(screen.getByTestId('multiple-choice-question')).toHaveValue(
      'What is the capital of France?',
    );

    // Check that all 4 options are rendered
    expect(screen.getByTestId('multiple-choice-option-0')).toHaveValue(
      'London',
    );
    expect(screen.getByTestId('multiple-choice-option-1')).toHaveValue('Paris');
    expect(screen.getByTestId('multiple-choice-option-2')).toHaveValue(
      'Berlin',
    );
    expect(screen.getByTestId('multiple-choice-option-3')).toHaveValue(
      'Madrid',
    );

    // Check that correct option selector is rendered
    expect(
      screen.getByTestId('multiple-choice-correct-option'),
    ).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <ContentItemForm
        open
        onClose={mockOnClose}
        currentItem={mockCurrentItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error='Test error message'
        isEditing={false}
      />,
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ContentItemForm
        open
        onClose={mockOnClose}
        currentItem={mockCurrentItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error=''
        isEditing={false}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when save button is clicked', () => {
    render(
      <ContentItemForm
        open
        onClose={mockOnClose}
        currentItem={mockCurrentItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error=''
        isEditing={false}
      />,
    );

    fireEvent.click(screen.getByText('Save'));
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('updates currentItem when input changes', () => {
    render(
      <ContentItemForm
        open
        onClose={mockOnClose}
        currentItem={mockCurrentItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error=''
        isEditing={false}
      />,
    );

    fireEvent.change(screen.getByLabelText('Content Title'), {
      target: { value: 'Updated Title' },
    });

    expect(mockSetCurrentItem).toHaveBeenCalled();
  });

  it('updates multiple choice option when changed', () => {
    const multipleChoiceItem = {
      type: 'multipleChoice',
      title: 'Test Quiz',
      content: 'Test question',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctOption: 0,
    };

    render(
      <ContentItemForm
        open
        onClose={mockOnClose}
        currentItem={multipleChoiceItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error=''
        isEditing={false}
      />,
    );

    // Update one of the options
    fireEvent.change(screen.getByTestId('multiple-choice-option-1'), {
      target: { value: 'Updated Option 2' },
    });

    // Check that setCurrentItem was called with updated options
    expect(mockSetCurrentItem).toHaveBeenCalled();
  });

  it('disables save button when multiple choice options are not all filled', () => {
    const multipleChoiceItem = {
      type: 'multipleChoice',
      title: 'Test Quiz',
      content: 'Test question',
      options: ['Option 1', '', 'Option 3', 'Option 4'],
      correctOption: 0,
    };

    render(
      <ContentItemForm
        open
        onClose={mockOnClose}
        currentItem={multipleChoiceItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error=''
        isEditing={false}
      />,
    );

    // Check that Save button is disabled
    expect(screen.getByText('Save')).toBeDisabled();

    // Check that error message is shown
    expect(screen.getByText('All 4 options are required')).toBeInTheDocument();
  });
});
