/**
 * Tests for utility functions
 */
import { checkGooseInstalled } from '../src/utils.js';
import { exec } from 'child_process';

// Mock the exec function
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('Utils', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkGooseInstalled', () => {
    it('should return true when Goose is installed', async () => {
      // Mock successful execution
      (exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'goose version 1.0.0' });
      });

      const result = await checkGooseInstalled();
      expect(result).toBe(true);
      expect(exec).toHaveBeenCalledWith('goose --version', expect.any(Function));
    });

    it('should return an error message when Goose is not installed', async () => {
      // Mock command not found error
      (exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(new Error('/bin/sh: goose: command not found'), { stdout: '', stderr: '' });
      });

      const result = await checkGooseInstalled();
      expect(result).toContain('Goose CLI is not installed');
      expect(exec).toHaveBeenCalledWith('goose --version', expect.any(Function));
    });

    it('should return the error message for other errors', async () => {
      // Mock other error
      (exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(new Error('Permission denied'), { stdout: '', stderr: '' });
      });

      const result = await checkGooseInstalled();
      expect(result).toContain('Error checking for Goose');
      expect(result).toContain('Permission denied');
      expect(exec).toHaveBeenCalledWith('goose --version', expect.any(Function));
    });
  });
});