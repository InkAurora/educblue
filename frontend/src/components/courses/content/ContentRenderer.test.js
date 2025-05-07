import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentRenderer from './ContentRenderer';
import axiosInstance from '../../../utils/axiosConfig';

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

// Mock the axiosConfig import
jest.mock('../../../utils/axiosConfig', () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
  };
});

// Mock MUI TextField component
jest.mock('@mui/material/TextField', () => {
  return function MockTextField(props) {
    return (
      <input
        data-testid={props['data-testid'] || 'quiz-answer-field'}
        value={props.value || ''}
        onChange={props.onChange}
        placeholder={props.placeholder}
      />
    );
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

describe('ContentRenderer - Quiz functionality', () => {
  const mockOnCompleted = jest.fn().mockResolvedValue(true);
  const mockProgress = [
    { contentId: 'quiz-1', completed: false, answer: 'Previous quiz answer' },
    { contentId: 'quiz-2', completed: true, answer: 'Another answer' },
  ];

  const mockQuizContent = {
    _id: 'quiz-1',
    id: 'quiz-1',
    type: 'quiz',
    title: 'Test Quiz',
    content: 'What is the capital of France?',
  };

  const courseId = 'course-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders quiz content with question and answer field', () => {
    render(
      <ContentRenderer
        contentItem={mockQuizContent}
        onCompleted={mockOnCompleted}
      />,
    );

    expect(screen.getByTestId('content-type')).toHaveTextContent('Quiz');
    expect(
      screen.getByText('What is the capital of France?'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('quiz-answer-field')).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toBeInTheDocument();
  });

  test('pre-fills quiz answer field with saved answer from progress data', () => {
    render(
      <ContentRenderer
        contentItem={mockQuizContent}
        onCompleted={mockOnCompleted}
        progress={mockProgress}
        courseId={courseId}
      />,
    );

    expect(screen.getByTestId('quiz-answer-field')).toHaveValue(
      'Previous quiz answer',
    );
  });

  test('displays "Submit Answer" button for quizzes', () => {
    render(
      <ContentRenderer
        contentItem={mockQuizContent}
        onCompleted={mockOnCompleted}
        courseId={courseId}
      />,
    );

    expect(screen.getByTestId('submit-answer-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-answer-button')).toHaveTextContent(
      'Submit Answer',
    );
  });

  test('"Submit Answer" button is disabled when the answer field is empty', () => {
    render(
      <ContentRenderer
        contentItem={mockQuizContent}
        onCompleted={mockOnCompleted}
        courseId={courseId}
      />,
    );

    expect(screen.getByTestId('submit-answer-button')).toBeDisabled();

    // Type something in the field
    fireEvent.change(screen.getByTestId('quiz-answer-field'), {
      target: { value: 'Paris' },
    });

    // Now the button should be enabled
    expect(screen.getByTestId('submit-answer-button')).not.toBeDisabled();
  });

  test('submits quiz answer successfully when clicking "Submit Answer"', async () => {
    // Mock successful API response
    axiosInstance.post.mockResolvedValueOnce({
      data: { contentId: 'quiz-1', completed: true, answer: 'Paris' },
    });

    render(
      <ContentRenderer
        contentItem={mockQuizContent}
        onCompleted={mockOnCompleted}
        courseId={courseId}
      />,
    );

    // Type an answer
    fireEvent.change(screen.getByTestId('quiz-answer-field'), {
      target: { value: 'Paris' },
    });

    // Click submit button
    fireEvent.click(screen.getByTestId('submit-answer-button'));

    // Check if the API was called with the right parameters
    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/progress/course-123/quiz-1',
        { answer: 'Paris', completed: true },
      );
    });

    // Check that onCompleted was called to update progress state
    await waitFor(() => {
      expect(mockOnCompleted).toHaveBeenCalled();
    });

    // Success message should appear
    await waitFor(() => {
      expect(screen.getByText('Answer saved!')).toBeInTheDocument();
    });
  });

  test('shows error alert when submitting quiz answer fails with 403', async () => {
    // Mock error response
    const errorResponse = {
      response: {
        status: 403,
        data: { message: 'Not enrolled in course' },
      },
    };
    axiosInstance.post.mockRejectedValueOnce(errorResponse);

    render(
      <ContentRenderer
        contentItem={mockQuizContent}
        onCompleted={mockOnCompleted}
        courseId={courseId}
      />,
    );

    // Type an answer
    fireEvent.change(screen.getByTestId('quiz-answer-field'), {
      target: { value: 'Paris' },
    });

    // Click submit button
    fireEvent.click(screen.getByTestId('submit-answer-button'));

    // Error message should appear
    await waitFor(() => {
      expect(
        screen.getByText(
          'You must be enrolled in this course to submit answers',
        ),
      ).toBeInTheDocument();
    });
  });

  test('"Mark as Completed" button is disabled for completed quizzes', () => {
    render(
      <ContentRenderer
        contentItem={mockQuizContent}
        isCompleted={true}
        onCompleted={mockOnCompleted}
        courseId={courseId}
      />,
    );

    expect(screen.getByTestId('complete-button')).toBeDisabled();
    expect(screen.getByTestId('complete-button')).toHaveTextContent(
      'Completed',
    );
  });
});
