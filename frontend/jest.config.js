module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^axios$': '<rootDir>/src/__mocks__/axios.js',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
