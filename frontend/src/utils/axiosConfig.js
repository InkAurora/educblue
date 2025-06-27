import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Get API host from environment variables
const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:5000';

// Create an axios instance with a base URL
const axiosInstance = axios.create({
  baseURL: API_HOST,
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
    const response = await axios.post(`${API_HOST}/api/auth/refresh`, {
      refreshToken,
    });

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
    // List of public endpoints that don't require authentication
    const publicEndpoints = [
      '/api/courses',
      '/api/progress',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/refresh',
    ];

    // Check if this is a public endpoint
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint),
    );

    // Get current token
    let token = localStorage.getItem('token');

    // If token exists but is expired, try to refresh it before the request
    if (token && isTokenExpired(token)) {
      try {
        token = await refreshAccessToken();
      } catch (error) {
        // If refresh fails and this is NOT a public endpoint, redirect
        if (!isPublicEndpoint && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        // For public endpoints, continue without token
        if (!isPublicEndpoint) {
          throw error;
        }
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

    // List of public endpoints that don't require authentication
    const publicEndpoints = [
      '/api/courses',
      '/api/progress',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/refresh',
    ];

    // Check if this is a public endpoint
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint),
    );

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
        // (Unless we're already there or this is a public endpoint)
        if (!isPublicEndpoint && !window.location.pathname.includes('/login')) {
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
