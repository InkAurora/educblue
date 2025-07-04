import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentRenderer from './ContentRenderer';

// Mock the markdown utils
jest.mock('../../../utils/markdownUtils', () => ({
  sanitizeMarkdown: jest.fn((content) => content),
  getMarkdownStyles: jest.fn(() => ({ color: 'inherit' })),
  convertMarkdownToHTML: jest.fn((content) => content || ''),
}));

// Mock react-markdown component
jest.mock(
  'react-markdown',
  () =>
    function MockReactMarkdown({ children }) {
      return <div data-testid='react-markdown'>{children}</div>;
    },
);

// Mock the axiosConfig import
jest.mock('../../../utils/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock MUI TextField component
jest.mock(
  '@mui/material/TextField',
  () =>
    function MockTextField({
      'data-testid': dataTestId = 'quiz-answer-field',
      value = '',
      onChange,
      placeholder,
    }) {
      return (
        <input
          data-testid={dataTestId}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      );
    },
);

// Mock MUI Radio component
jest.mock(
  '@mui/material/Radio',
  () =>
    function MockRadio({ value, checked, onChange }) {
      return (
        <input
          type='radio'
          data-testid={`radio-${value}`}
          checked={checked}
          onChange={onChange}
          value={value}
        />
      );
    },
);

// Mock MUI FormControlLabel component
jest.mock(
  '@mui/material/FormControlLabel',
  () =>
    function MockFormControlLabel({ value, control, label }) {
      return (
        <label data-testid={`label-${value}`} htmlFor={`control-${value}`}>
          {control}
          <span>{label}</span>
        </label>
      );
    },
);

// Mock MUI RadioGroup component
jest.mock(
  '@mui/material/RadioGroup',
  () =>
    function MockRadioGroup({
      'data-testid': dataTestId = 'multiple-choice-options',
      onChange,
      value,
      children,
    }) {
      return (
        <div data-testid={dataTestId} onChange={onChange} value={value}>
          {children}
        </div>
      );
    },
);

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

    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
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
        isCompleted
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
        completing
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

    // Should at least render the complete button
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

  test('"Mark as Completed" button is disabled for completed quizzes', () => {
    render(
      <ContentRenderer
        contentItem={mockQuizContent}
        isCompleted
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

describe('ContentRenderer - Multiple Choice Quiz functionality', () => {
  const mockOnCompleted = jest.fn().mockResolvedValue(true);

  const mockMultipleChoiceContent = {
    _id: 'mc-quiz-1',
    id: 'mc-quiz-1',
    type: 'multipleChoice',
    title: 'Multiple Choice Quiz',
    content: 'What is the largest planet in our solar system?',
    options: ['Earth', 'Jupiter', 'Saturn', 'Mars'],
  };

  const courseId = 'course-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('renders multiple choice quiz with question and radio options', () => {
    render(
      <ContentRenderer
        contentItem={mockMultipleChoiceContent}
        onCompleted={mockOnCompleted}
        courseId={courseId}
      />,
    );

    // Verify question renders
    expect(
      screen.getByText('What is the largest planet in our solar system?'),
    ).toBeInTheDocument();

    // Verify all 4 options render
    expect(screen.getByText('Earth')).toBeInTheDocument();
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
    expect(screen.getByText('Mars')).toBeInTheDocument();

    // Verify submit button is present but disabled (no option selected)
    expect(
      screen.getByTestId('submit-multiple-choice-button'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('submit-multiple-choice-button')).toBeDisabled();
  });

  test('pre-fills selected option and score from progress data', () => {
    const mockProgress = [
      { contentId: 'mc-quiz-1', completed: true, answer: 1, score: 1 },
    ];

    render(
      <ContentRenderer
        contentItem={mockMultipleChoiceContent}
        onCompleted={mockOnCompleted}
        progress={mockProgress}
        courseId={courseId}
      />,
    );

    // Should display score feedback
    expect(screen.getByTestId('quiz-score-feedback')).toBeInTheDocument();
    expect(screen.getByText('Correct! Score: 1')).toBeInTheDocument();
  });

  test('displays correct UI elements for multiple choice quiz', () => {
    render(
      <ContentRenderer
        contentItem={mockMultipleChoiceContent}
        onCompleted={mockOnCompleted}
        courseId={courseId}
      />,
    );

    // Check for submit button
    expect(
      screen.getByTestId('submit-multiple-choice-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('submit-multiple-choice-button'),
    ).toHaveTextContent('Submit Answer');

    // Check for options container
    expect(screen.getByTestId('multiple-choice-options')).toBeInTheDocument();

    // Check for completion button
    expect(screen.getByTestId('complete-button')).toBeInTheDocument();
  });
});
