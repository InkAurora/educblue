module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^axios$': '<rootDir>/src/__mocks__/axios.js',
    '\.(css|less|sass|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-markdown|micromark|decode-named-character-reference|character-entities|property-information|space-separated-tokens|comma-separated-tokens|hast-util-whitespace|style-to-object|unified|bail|is-plain-obj|trough|vfile|vfile-message|unist-util-stringify-position|mdast-util-from-markdown|mdast-util-to-string|micromark-util|mdast-util-to-hast|hast|hast-util|remark|dompurify)/)',
  ],
};
