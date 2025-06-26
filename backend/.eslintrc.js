module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true, // Add Jest environment for test files
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'warn',
    'no-underscore-dangle': ['error', { allow: ['_id', '_doc'] }], // Allow MongoDB ObjectId fields
    'consistent-return': 'off', // Turn off for middleware functions that don't always return
    'no-return-await': 'error', // Keep this rule to fix redundant awaits
  },
};
