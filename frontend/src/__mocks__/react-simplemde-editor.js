// Mock implementation of SimpleMDE editor for tests
import React from 'react';

const SimpleMDE = ({ value, onChange, options }) => {
  return (
    <textarea
      data-testid='markdown-editor'
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default SimpleMDE;
