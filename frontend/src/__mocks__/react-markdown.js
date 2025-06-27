// Mock implementation of ReactMarkdown for tests
import React from 'react';

function ReactMarkdown({ children }) {
  return <div data-testid='markdown-content'>{children}</div>;
}

// Export as default and named export to support both import styles
export default ReactMarkdown;
export { ReactMarkdown };
