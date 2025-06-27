import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, LinearProgress } from '@mui/material';

/**
 * A progress bar component to visualize course completion
 * @param {Object} props Component props
 * @param {Number} props.percentage The percentage of course completion (0-100)
 * @returns {JSX.Element} The progress bar component
 */
const ProgressBar = ({ percentage }) => {
  // Ensure percentage is a valid number between 0 and 100
  const validPercentage = (() => {
    // Check if percentage is a valid number
    if (typeof percentage !== 'number' || isNaN(percentage)) {
      return 0;
    }
    // Clamp between 0 and 100
    return Math.min(100, Math.max(0, percentage));
  })();

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {/* Linear Progress Bar */}
      <Box sx={{ width: '100%' }}>
        <LinearProgress
          variant='determinate'
          value={validPercentage}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
            },
          }}
        />
      </Box>

      {/* Text below progress bar */}
      <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant='body2' color='text.secondary'>
          Progress: {Math.round(validPercentage)}%
        </Typography>
      </Box>
    </Box>
  );
};

ProgressBar.propTypes = {
  percentage: PropTypes.number,
};

ProgressBar.defaultProps = {
  percentage: 0,
};

export default ProgressBar;
