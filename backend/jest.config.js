// jest.config.js
module.exports = {
  testTimeout: 30000, // Increase timeout to 30 seconds
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/testSetup.js',
    '<rootDir>/tests/setup.js',
  ],
};
