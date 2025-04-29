import axios from 'axios';

// Create an axios instance with a base URL
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to each request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add a response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('Refresh token not found');
        }

        const response = await axios.post(
          'http://localhost:5000/api/auth/refresh',
          {
            refreshToken,
          },
        );

        // If successful, update the tokens
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update auth header for the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh token is invalid or expired, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        // We can't directly use useNavigate here since this is outside of a React component
        // Instead, we'll use the window.location to navigate to login
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    // If it's not a 401 or we've already retried, just reject
    return Promise.reject(error);
  },
);

export default axiosInstance;
