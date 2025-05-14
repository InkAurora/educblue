import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressBar from '../../components/courses/ProgressBar';

describe('ProgressBar', () => {
  test('renders with 0% progress', () => {
    render(<ProgressBar percentage={0} />);

    // Check if the progress text is visible
    expect(screen.getByText('Progress: 0%')).toBeInTheDocument();

    // Check if LinearProgress component is rendered
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  test('renders with 50% progress', () => {
    render(<ProgressBar percentage={50} />);

    expect(screen.getByText('Progress: 50%')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  test('renders with 100% progress', () => {
    render(<ProgressBar percentage={100} />);

    expect(screen.getByText('Progress: 100%')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  test('handles invalid percentage values', () => {
    // Test with negative value
    render(<ProgressBar percentage={-20} />);
    expect(screen.getByText('Progress: 0%')).toBeInTheDocument();

    // Re-render with value > 100
    render(<ProgressBar percentage={120} />);
    expect(screen.getByText('Progress: 100%')).toBeInTheDocument();

    // Re-render with non-numeric value
    render(<ProgressBar percentage='invalid' />);
    expect(screen.getByText('Progress: 0%')).toBeInTheDocument();

    // Re-render with undefined value
    render(<ProgressBar percentage={undefined} />);
    expect(screen.getByText('Progress: 0%')).toBeInTheDocument();
  });

  test('has correct styling', () => {
    render(<ProgressBar percentage={50} />);

    // Check main container styling
    const container = screen
      .getByText('Progress: 50%')
      .closest('div').parentElement;
    expect(container).toHaveStyle('width: 100%');

    // Check progress bar existence and attributes
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });
});
