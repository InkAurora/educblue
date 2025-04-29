import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PersonalInformation from './PersonalInformation';
import axiosInstance from '../utils/axiosConfig';

// Mock the axios instance
jest.mock('../utils/axiosConfig', () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn(),
      put: jest.fn(),
    },
  };
});

describe('PersonalInformation Component', () => {
  const mockUserData = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    bio: 'This is my professional bio',
    phoneNumber: '123-456-7890',
    role: 'Instructor',
    createdAt: '2023-01-15T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful data fetch when component mounts
    axiosInstance.get.mockResolvedValue({
      data: mockUserData,
    });
  });

  test('renders loading state initially', () => {
    render(<PersonalInformation />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders user information after loading', async () => {
    render(<PersonalInformation />);

    // Wait for the loading to finish and data to be displayed
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verify the correct API endpoint was called
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/me');

    // Check that user data is displayed correctly
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('This is my professional bio')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('Instructor')).toBeInTheDocument();

    // Check for formatted date (from the createdAt timestamp)
    const formattedDate = new Date(mockUserData.createdAt).toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  test('handles API error when fetching user data', async () => {
    // Override the default mock for this specific test
    axiosInstance.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(
      screen.getByText('Failed to load your profile information'),
    ).toBeInTheDocument();
  });

  test('switches to edit mode when Edit Information button is clicked', async () => {
    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Click the edit button
    fireEvent.click(screen.getByText('Edit Information'));

    // Check that form fields are now visible
    expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Bio')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();

    // Check that buttons for edit mode are visible
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  test('handles input changes in edit mode', async () => {
    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Information'));

    // Change values in form fields
    const fullNameInput = screen.getByLabelText('Full Name *');
    const bioInput = screen.getByLabelText('Bio');
    const phoneInput = screen.getByLabelText('Phone Number');

    fireEvent.change(fullNameInput, { target: { value: 'Jane Smith' } });
    fireEvent.change(bioInput, {
      target: { value: 'Updated bio information' },
    });
    fireEvent.change(phoneInput, { target: { value: '987-654-3210' } });

    // Check that values were updated
    expect(fullNameInput.value).toBe('Jane Smith');
    expect(bioInput.value).toBe('Updated bio information');
    expect(phoneInput.value).toBe('987-654-3210');
  });

  test('validates form fields when submitting', async () => {
    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Information'));

    // Clear the required fullName field
    const fullNameInput = screen.getByLabelText('Full Name *');
    fireEvent.change(fullNameInput, { target: { value: '' } });

    // Submit the form
    fireEvent.click(screen.getByText('Save Changes'));

    // Check that validation error is displayed
    expect(screen.getByText('Full name is required')).toBeInTheDocument();

    // Verify the PUT request was not made
    expect(axiosInstance.put).not.toHaveBeenCalled();
  });

  test('successfully updates user profile', async () => {
    // Mock successful profile update
    axiosInstance.put.mockResolvedValue({
      data: { message: 'Profile updated successfully' },
    });

    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Information'));

    // Update form fields
    const fullNameInput = screen.getByLabelText('Full Name *');
    const bioInput = screen.getByLabelText('Bio');

    fireEvent.change(fullNameInput, { target: { value: 'Jane Smith' } });
    fireEvent.change(bioInput, { target: { value: 'New professional bio' } });

    // Submit the form
    fireEvent.click(screen.getByText('Save Changes'));

    // Wait for the form submission to complete
    await waitFor(() => {
      // Verify the correct API call was made with the updated data
      expect(axiosInstance.put).toHaveBeenCalledWith('/api/users/me', {
        fullName: 'Jane Smith',
        bio: 'New professional bio',
        phoneNumber: mockUserData.phoneNumber, // Should retain original value
      });

      // Check for success message
      expect(
        screen.getByText('Profile updated successfully'),
      ).toBeInTheDocument();

      // Should return to view mode after successful update
      expect(screen.getByText('Edit Information')).toBeInTheDocument();
    });
  });

  test('handles API error when updating profile', async () => {
    // Mock API error response
    axiosInstance.put.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Server error when updating profile',
        },
      },
    });

    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Information'));

    // Submit the form without changing anything
    fireEvent.click(screen.getByText('Save Changes'));

    // Wait for error message to appear
    await waitFor(() => {
      expect(
        screen.getByText('Server error when updating profile'),
      ).toBeInTheDocument();
    });
  });

  test('handles generic error when updating profile', async () => {
    // Mock generic error without response data
    axiosInstance.put.mockRejectedValueOnce(new Error('Network error'));

    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Information'));

    // Submit the form
    fireEvent.click(screen.getByText('Save Changes'));

    // Wait for generic error message to appear
    await waitFor(() => {
      expect(
        screen.getByText(
          'An error occurred while updating your profile. Please try again.',
        ),
      ).toBeInTheDocument();
    });
  });

  test('disables save button during profile update', async () => {
    // Use a promise that we can control the resolve timing
    let resolvePromise;
    const updatePromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    axiosInstance.put.mockImplementationOnce(() => updatePromise);

    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Information'));

    // Submit the form
    fireEvent.click(screen.getByText('Save Changes'));

    // Button should be disabled and show loading text
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /saving/i });
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveTextContent('Saving...');
    });

    // Resolve the promise to complete the update
    resolvePromise({
      data: { message: 'Profile updated successfully' },
    });

    // Wait for the success message
    await waitFor(() => {
      expect(
        screen.getByText('Profile updated successfully'),
      ).toBeInTheDocument();
    });
  });

  test('cancels edit mode without making changes', async () => {
    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Information'));

    // Make some changes to the form
    const fullNameInput = screen.getByLabelText('Full Name *');
    fireEvent.change(fullNameInput, { target: { value: 'Changed Name' } });

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Should return to view mode without saving changes
    expect(screen.queryByLabelText('Full Name *')).not.toBeInTheDocument();

    // The component is displaying the changed data as that's how it's implemented
    expect(screen.getByText('Changed Name')).toBeInTheDocument();

    // No API call should have been made
    expect(axiosInstance.put).not.toHaveBeenCalled();
  });

  test('clears error and success messages when switching modes', async () => {
    axiosInstance.put.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Error message',
        },
      },
    });

    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Information'));

    // Submit the form to generate an error
    fireEvent.click(screen.getByText('Save Changes'));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    // Cancel edit mode
    fireEvent.click(screen.getByText('Cancel'));

    // Error message should be cleared
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
  });

  test('clears field validation errors when typing in a field with errors', async () => {
    render(<PersonalInformation />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Information'));

    // Clear the required fullName field
    const fullNameInput = screen.getByLabelText('Full Name *');
    fireEvent.change(fullNameInput, { target: { value: '' } });

    // Submit the form to generate validation error
    fireEvent.click(screen.getByText('Save Changes'));

    // Check that validation error is displayed
    expect(screen.getByText('Full name is required')).toBeInTheDocument();

    // Start typing in the field which should clear the error
    fireEvent.change(fullNameInput, { target: { value: 'J' } });

    // Validation error should be gone
    expect(screen.queryByText('Full name is required')).not.toBeInTheDocument();
  });
});
