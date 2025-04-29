// axios.js mock implementation
const mockAxiosInstance = jest
  .fn()
  .mockImplementation(() => Promise.resolve({ data: 'success' }));

// Store interceptors for testing
const requestInterceptors = [];
const responseInterceptors = [];

// Provide access to interceptors for tests
mockAxiosInstance._getRequestInterceptors = () => requestInterceptors;
mockAxiosInstance._getResponseInterceptors = () => responseInterceptors;

// Create interceptors object
mockAxiosInstance.interceptors = {
  request: {
    use: jest.fn((successFn, errorFn) => {
      requestInterceptors.push({ success: successFn, error: errorFn });
      return requestInterceptors.length - 1;
    }),
    eject: jest.fn((id) => {
      requestInterceptors[id] = null;
    }),
  },
  response: {
    use: jest.fn((successFn, errorFn) => {
      responseInterceptors.push({ success: successFn, error: errorFn });
      return responseInterceptors.length - 1;
    }),
    eject: jest.fn((id) => {
      responseInterceptors[id] = null;
    }),
  },
};

// Set up the main mock object
const axios = {
  create: jest.fn().mockReturnValue(mockAxiosInstance),
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

// Make it a proper ES module and CommonJS module
axios.default = axios;
module.exports = axios;
