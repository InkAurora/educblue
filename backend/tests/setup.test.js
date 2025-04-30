const { describe, it, expect } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

/**
 * This test verifies that all required test files exist
 * This avoids loading the actual test files which creates nesting issues
 */
describe('Test Files Existence Verification', () => {
  // Function to recursively find all test files in a directory
  const findTestFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Recursively search directories
        results = results.concat(findTestFiles(filePath));
      } else if (
        // Only include .js files with test or spec in the name
        file.endsWith('.test.js') ||
        file.endsWith('.spec.js')
      ) {
        results.push(filePath);
      }
    });

    return results;
  };

  // Get all test files
  const testDir = path.resolve(__dirname);
  const testFiles = findTestFiles(testDir).filter(
    (filePath) => !filePath.includes('setup.test.js')
  );

  // Instead of requiring them, just verify they exist
  it('should have test files available', () => {
    expect(testFiles.length).toBeGreaterThan(0);

    // Log all test files found for verification
    console.log(`Found ${testFiles.length} test files`);

    // Make sure each file exists and is readable
    testFiles.forEach((file) => {
      expect(fs.existsSync(file)).toBe(true);
      expect(() => fs.accessSync(file, fs.constants.R_OK)).not.toThrow();
    });
  });
});
