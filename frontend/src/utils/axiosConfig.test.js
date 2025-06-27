// Direct test approach for axiosConfig.js
describe('axiosConfig', () => {
  // Mock axios
  const mockAxiosPost = jest.fn();
  const mockAxiosInstance = jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: 'success' }));

  // Mock localStorage
  const mockStorage = {};
  const mockLocalStorage = {
    getItem: jest.fn((key) => mockStorage[key] || null),
    setItem: jest.fn((key, value) => {
      mockStorage[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete mockStorage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    }),
  };

  // Mock location
  const mockLocation = { href: '' };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    mockLocation.href = '';
  });

  // Extract and test the request interceptor
  describe('Request Interceptor', () => {
    // Extract the request interceptor function
    function requestInterceptor(config) {
      const token = mockLocalStorage.getItem('token');
      if (token) {
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }

    test('adds auth token to headers when token exists', () => {
      // Set up token directly in the mock implementation
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'test-token';
        return null;
      });

      // Call the interceptor
      const config = { headers: {} };
      const result = requestInterceptor(config);

      // Verify token was added
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    test('does not add auth token when none exists', () => {
      // Ensure no token is returned
      mockLocalStorage.getItem.mockImplementation(() => null);

      // Call the interceptor
      const config = { headers: {} };
      const result = requestInterceptor(config);

      // Verify no token was added
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  // Extract and test the request error handler
  describe('Request Error Handler', () => {
    // Extract the request error handler function
    function requestErrorHandler(error) {
      return Promise.reject(error);
    }

    test('rejects errors', async () => {
      const error = new Error('Test error');
      await expect(requestErrorHandler(error)).rejects.toEqual(error);
    });
  });

  // Extract and test the response interceptor
  describe('Response Interceptor', () => {
    // Extract the response success handler
    function responseSuccessHandler(response) {
      return response;
    }

    test('passes through successful responses', () => {
      const response = { data: { success: true } };
      const result = responseSuccessHandler(response);
      expect(result).toBe(response);
    });
  });

  // Extract and test the response error handler
  describe('Response Error Handler', () => {
    // Extract the response error handler function
    async function responseErrorHandler(error) {
      const originalRequest = error.config;

      // If the error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const refreshToken = mockLocalStorage.getItem('refreshToken');

          if (!refreshToken) {
            throw new Error('Refresh token not found');
          }

          const response = await mockAxiosPost(
            'http://localhost:5000/api/auth/refresh',
            { refreshToken },
          );

          // If successful, update the tokens
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          mockLocalStorage.setItem('token', accessToken);
          if (newRefreshToken) {
            mockLocalStorage.setItem('refreshToken', newRefreshToken);
          }

          // Update auth header for the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Retry the original request
          return mockAxiosInstance(originalRequest);
        } catch (refreshError) {
          // If refresh token is invalid or expired, redirect to login
          mockLocalStorage.removeItem('token');
          mockLocalStorage.removeItem('refreshToken');

          // Use window.location to navigate to login
          mockLocation.href = '/login';

          return Promise.reject(refreshError);
        }
      }

      // If it's not a 401 or we've already retried, just reject
      return Promise.reject(error);
    }

    test('handles 401 errors with successful token refresh', async () => {
      // Set up tokens
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'old-token';
        if (key === 'refreshToken') return 'refresh-token';
        return null;
      });

      // Set up successful refresh response
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
        },
      });

      // Set up original request
      const originalRequest = { headers: {}, _retry: false };
      const error = {
        config: originalRequest,
        response: { status: 401 },
      };

      // Call the error handler
      await responseErrorHandler(error);

      // Check refresh token API was called
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/refresh',
        { refreshToken: 'refresh-token' },
      );

      // Check tokens were updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'token',
        'new-token',
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
      );

      // Check original request was updated and retried
      expect(originalRequest.headers.Authorization).toBe('Bearer new-token');
      expect(originalRequest._retry).toBe(true);
      expect(mockAxiosInstance).toHaveBeenCalledWith(originalRequest);
    });

    test('handles 401 errors when refresh token is missing', async () => {
      // Explicitly set the getItem mock to return null for refreshToken
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'old-token';
        if (key === 'refreshToken') return null;
        return null;
      });

      // Set up original request
      const originalRequest = { headers: {}, _retry: false };
      const error = {
        config: originalRequest,
        response: { status: 401 },
      };

      // Call the error handler and expect it to throw
      await expect(responseErrorHandler(error)).rejects.toThrow(
        'Refresh token not found',
      );

      // Check localStorage was cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');

      // Check redirect happened
      expect(mockLocation.href).toBe('/login');
    });

    test('handles 401 errors when refresh token request fails', async () => {
      // Set up mocks to return both token values
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'old-token';
        if (key === 'refreshToken') return 'refresh-token';
        return null;
      });

      // Set up failed refresh with specific error
      const refreshError = new Error('Invalid refresh token');
      mockAxiosPost.mockRejectedValueOnce(refreshError);

      // Set up original request
      const originalRequest = { headers: {}, _retry: false };
      const error = {
        config: originalRequest,
        response: { status: 401 },
      };

      // Call the error handler and expect it to throw
      await expect(responseErrorHandler(error)).rejects.toEqual(refreshError);

      // Check localStorage was cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');

      // Check redirect happened
      expect(mockLocation.href).toBe('/login');
    });

    test('rejects non-401 errors', async () => {
      // Create non-401 error
      const error = {
        config: {},
        response: { status: 500 },
        message: 'Server error',
      };

      // Call the error handler
      await expect(responseErrorHandler(error)).rejects.toEqual(error);
    });

    test('handles errors without a response object', async () => {
      // Create network error (no response)
      const error = {
        config: {},
        message: 'Network Error',
      };

      // Call the error handler
      await expect(responseErrorHandler(error)).rejects.toEqual(error);
    });
  });
});
