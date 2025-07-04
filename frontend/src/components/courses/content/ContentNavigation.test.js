import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContentNavigation from './ContentNavigation';

// Wrapper to provide router context
function TestWrapper({ children }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('ContentNavigation', () => {
  const courseId = 'course-123';
  const sectionId = 'section-456';
  const contentTitle = 'Test Content';

  it('renders with title and navigation buttons', () => {
    render(
      <ContentNavigation
        courseId={courseId}
        sectionId={sectionId}
        title={contentTitle}
        previousContentId='prev-123'
        nextContentId='next-456'
      />,
      { wrapper: TestWrapper },
    );

    // Check that title and buttons are rendered
    expect(screen.getByTestId('content-title')).toHaveTextContent(contentTitle);
    expect(screen.getByTestId('prev-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();

    // Check that buttons are enabled
    const prevButton = screen.getByTestId('prev-button');
    const nextButton = screen.getByTestId('next-button');

    expect(prevButton).not.toHaveAttribute('aria-disabled', 'true');
    expect(nextButton).not.toHaveAttribute('aria-disabled', 'true');

    // Check for correct href attributes (Link components render as <a> elements)
    expect(prevButton.closest('a')).toHaveAttribute(
      'href',
      '/courses/course-123/sections/section-456/content/prev-123',
    );
    expect(nextButton.closest('a')).toHaveAttribute(
      'href',
      '/courses/course-123/sections/section-456/content/next-456',
    );
  });

  it('truncates long titles appropriately', () => {
    const longTitle =
      'This is a very long title that should be truncated in the UI based on available space';
    render(
      <ContentNavigation
        courseId={courseId}
        sectionId={sectionId}
        title={longTitle}
        previousContentId='prev-123'
        nextContentId='next-456'
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('content-title')).toHaveTextContent(longTitle);

    // We're not testing the actual truncation because it's CSS-based,
    // but this ensures the long title is properly rendered
  });

  it('disables previous button when no previous content', () => {
    render(
      <ContentNavigation
        courseId={courseId}
        sectionId={sectionId}
        title={contentTitle}
        previousContentId={null}
        nextContentId='next-456'
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('prev-button')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByTestId('next-button')).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('disables next button when no next content', () => {
    render(
      <ContentNavigation
        courseId={courseId}
        sectionId={sectionId}
        title={contentTitle}
        previousContentId='prev-123'
        nextContentId={null}
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('prev-button')).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByTestId('next-button')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('disables both buttons when no navigation is possible', () => {
    render(
      <ContentNavigation
        courseId={courseId}
        sectionId={sectionId}
        title={contentTitle}
        previousContentId={null}
        nextContentId={null}
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('prev-button')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByTestId('next-button')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('uses default props when optional props are not provided', () => {
    render(
      <ContentNavigation
        courseId={courseId}
        sectionId={sectionId}
        title={contentTitle}
      />,
      { wrapper: TestWrapper },
    );

    // Both buttons should be disabled when no content IDs are provided
    expect(screen.getByTestId('prev-button')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByTestId('next-button')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
