import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContentRenderer from './ContentRenderer';

// Mock the markdown utils
jest.mock('../../../utils/markdownUtils', () => ({
  sanitizeMarkdown: jest.fn((content) => content),
  getMarkdownStyles: jest.fn(() => ({ color: 'inherit' })),
}));

// Mock react-markdown component
jest.mock('react-markdown', () => {
  return function MockReactMarkdown(props) {
    return <div data-testid='react-markdown'>{props.children}</div>;
  };
});

describe('ContentRenderer', () => {
  const mockOnCompleted = jest.fn();

  it('renders video content correctly', () => {
    const videoContent = {
      type: 'video',
      title: 'Introduction Video',
      videoUrl: 'https://example.com/video.mp4',
      content: '',
    };

    render(
      <ContentRenderer
        contentItem={videoContent}
        isCompleted={false}
        completing={false}
        onCompleted={mockOnCompleted}
      />,
    );

    expect(screen.getByTestId('content-type')).toHaveTextContent('Video');
    expect(screen.getByTestId('video-content')).toBeInTheDocument();
    expect(screen.getByTestId('video-player')).toBeInTheDocument();
    // Video content doesn't have completion button
    expect(screen.queryByTestId('complete-button')).not.toBeInTheDocument();
  });

  it('renders markdown content correctly', () => {
    const markdownContent = {
      type: 'markdown',
      title: 'Course Description',
      videoUrl: '',
      content: '# Course Description\n\nThis is a detailed description.',
    };

    render(
      <ContentRenderer
        contentItem={markdownContent}
        isCompleted={false}
        completing={false}
        onCompleted={mockOnCompleted}
      />,
    );

    expect(screen.getByTestId('content-type')).toHaveTextContent('Markdown');
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toHaveTextContent(
      'Mark as Completed',
    );
  });

  it('renders quiz content correctly', () => {
    const quizContent = {
      type: 'quiz',
      title: 'Quiz 1',
      videoUrl: '',
      content: 'What is the capital of France?',
    };

    render(
      <ContentRenderer
        contentItem={quizContent}
        isCompleted={false}
        completing={false}
        onCompleted={mockOnCompleted}
      />,
    );

    expect(screen.getByTestId('content-type')).toHaveTextContent('Quiz');
    expect(screen.getByTestId('quiz-content')).toBeInTheDocument();
    expect(
      screen.getByText('What is the capital of France?'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('quiz-answer-field')).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toHaveTextContent(
      'Mark as Completed',
    );
  });

  it('shows completed status when content is marked as completed', () => {
    const markdownContent = {
      type: 'markdown',
      title: 'Course Description',
      videoUrl: '',
      content: 'This is a description.',
    };

    render(
      <ContentRenderer
        contentItem={markdownContent}
        isCompleted={true}
        completing={false}
        onCompleted={mockOnCompleted}
      />,
    );

    expect(screen.getByTestId('complete-button')).toHaveTextContent(
      'Completed',
    );
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });

  it('shows marking status when completing', () => {
    const markdownContent = {
      type: 'markdown',
      title: 'Course Description',
      videoUrl: '',
      content: 'This is a description.',
    };

    render(
      <ContentRenderer
        contentItem={markdownContent}
        isCompleted={false}
        completing={true}
        onCompleted={mockOnCompleted}
      />,
    );

    expect(screen.getByTestId('complete-button')).toHaveTextContent(
      'Marking...',
    );
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });

  it('calls onCompleted when complete button is clicked', () => {
    const markdownContent = {
      type: 'markdown',
      title: 'Course Description',
      videoUrl: '',
      content: 'This is a description.',
    };

    render(
      <ContentRenderer
        contentItem={markdownContent}
        isCompleted={false}
        completing={false}
        onCompleted={mockOnCompleted}
      />,
    );

    fireEvent.click(screen.getByTestId('complete-button'));
    expect(mockOnCompleted).toHaveBeenCalledTimes(1);
  });

  it('calls onCompleted when video ends', () => {
    const videoContent = {
      type: 'video',
      title: 'Introduction Video',
      videoUrl: 'https://example.com/video.mp4',
      content: '',
    };

    render(
      <ContentRenderer
        contentItem={videoContent}
        isCompleted={false}
        completing={false}
        onCompleted={mockOnCompleted}
      />,
    );

    fireEvent.ended(screen.getByTestId('video-player'));
    expect(mockOnCompleted).toHaveBeenCalledTimes(1);
  });

  it('handles content with no type gracefully', () => {
    const unknownContent = {
      title: 'Unknown Content',
      videoUrl: '',
      content: 'Some content',
    };

    render(
      <ContentRenderer
        contentItem={unknownContent}
        isCompleted={false}
        completing={false}
        onCompleted={mockOnCompleted}
      />,
    );

    // Should at least render the type badge (as empty or undefined)
    expect(screen.getByTestId('content-type')).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toBeInTheDocument();
  });
});
