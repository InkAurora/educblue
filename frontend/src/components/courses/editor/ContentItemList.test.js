import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContentItemList from './ContentItemList';

describe('ContentItemList', () => {
  const mockContent = [
    {
      type: 'video',
      title: 'Introduction Video',
      videoUrl: 'https://example.com/video1.mp4',
      content: '',
    },
    {
      type: 'markdown',
      title: 'Course Description',
      videoUrl: '',
      content: '# Course Description\n\nThis is a detailed description.',
    },
  ];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnAdd = jest.fn();

  it('renders a list of content items when content exists', () => {
    render(
      <ContentItemList
        content={mockContent}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />,
    );

    expect(screen.getByText('Introduction Video')).toBeInTheDocument();
    expect(screen.getByText('Course Description')).toBeInTheDocument();
    expect(screen.getByText('Type: video')).toBeInTheDocument();
    expect(screen.getByText('Type: markdown')).toBeInTheDocument();
  });

  it('renders an info message when no content exists', () => {
    render(
      <ContentItemList
        content={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />,
    );

    expect(screen.getByText(/No content added yet/i)).toBeInTheDocument();
  });

  it('calls onAdd when Add Content button is clicked', () => {
    render(
      <ContentItemList
        content={mockContent}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />,
    );

    fireEvent.click(screen.getByText('Add Content'));
    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <ContentItemList
        content={mockContent}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />,
    );

    // Click the first edit button
    const editButtons = screen.getAllByLabelText('edit');
    fireEvent.click(editButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledWith(0);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <ContentItemList
        content={mockContent}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />,
    );

    // Click the first delete button
    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledWith(0);
  });
});
