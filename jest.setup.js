// Jest setup file

// Mock the formatFileSize function since it's new
global.mockFormatFileSize = (size) => `${size} bytes`;

// Because we're using ESM modules, Jest can have issues with dynamic imports
// Ensure globals are properly defined
if (typeof jest === 'undefined') {
  global.jest = {
    fn: () => ({ mockReturnValue: () => {} }),
    mock: () => {}
  };
}