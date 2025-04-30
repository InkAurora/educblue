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

  it('renders correctly for video type', () => {
    render(
      <ContentItemForm
        open={true}
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
        open={true}
        onClose={mockOnClose}
        currentItem={markdownItem}
        setCurrentItem={mockSetCurrentItem}
        onSave={mockOnSave}
        error=''
        isEditing={true}
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

  it('displays error message when provided', () => {
    render(
      <ContentItemForm
        open={true}
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
        open={true}
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
        open={true}
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
        open={true}
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
});
