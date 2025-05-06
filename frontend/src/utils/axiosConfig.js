import axios from 'axios';
import jwtDecode from 'jwt-decode';

// Create an axios instance with a base URL
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to check if a token is expired or invalid
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    // Check if token is expired (with 10s buffer to avoid edge cases)
    return decoded.exp < Date.now() / 1000 - 10;
  } catch (error) {
    // If token can't be decoded, consider it invalid
    return true;
  }
};

// Function to refresh the access token using refresh token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('Refresh token not found');
  }

  try {
    const response = await axios.post(
      'http://localhost:5000/api/auth/refresh',
      { refreshToken },
    );

    // Store the new access token
    const { token } = response.data;
    localStorage.setItem('token', token);

    return token;
  } catch (error) {
    // If refresh failed, clear both tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    throw error;
  }
};

// Add a request interceptor to add the auth token to each request and refresh if needed
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get current token
    let token = localStorage.getItem('token');

    // If token exists but is expired, try to refresh it before the request
    if (token && isTokenExpired(token)) {
      try {
        token = await refreshAccessToken();
      } catch (error) {
        // If refresh fails and we're not already on the login page, redirect
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw error;
      }
    }

    // Add token to request headers if it exists
    if (token) {
      // Create a new config object with updated headers to avoid linting issues
      const updatedConfig = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
      return updatedConfig;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Add a response interceptor to handle 401 errors as backup
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest.retried) {
      originalRequest.retried = true;

      try {
        // Try to get a new token
        const token = await refreshAccessToken();

        // Update auth header for the original request
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${token}`,
        };

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh token is invalid or expired, redirect to login
        // (Unless we're already there)
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // If it's not a 401 or we've already retried, just reject
    return Promise.reject(error);
  },
);

export default axiosInstance;
