/**
 * System tests for Mother Goose
 */
import { checkGooseInstalled } from '../src/utils.js';
import { spawn } from 'child_process';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Skip actual server connection for these tests
jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return {
    StdioServerTransport: jest.fn().mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

jest.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      setRequestHandler: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit;
beforeAll(() => {
  process.exit = jest.fn() as any;
});

afterAll(() => {
  process.exit = originalExit;
});

// Mock console.error to not clutter test output
console.error = jest.fn();

describe('Mother Goose System Tests', () => {
  describe('Goose Installation', () => {
    it('should check if Goose is installed', async () => {
      // Note: This test will be skipped in CI environments where Goose isn't installed
      const result = await checkGooseInstalled();
      
      // Check if the result is a string (error message) or true (installed)
      if (typeof result === 'string') {
        console.log('Skipping test because Goose is not installed:', result);
        return;
      }
      
      expect(result).toBe(true);
    });
  });

  describe('Server Startup', () => {
    it('should create and initialize the MCP server', async () => {
      // Import the main file which creates and starts the server
      const { default: main } = await import('../src/index.js');
      
      // The server initialization should occur during the import
      expect(Server).toHaveBeenCalled();
      expect(StdioServerTransport).toHaveBeenCalled();
      
      // The server should have registered handlers for the MCP protocol
      const serverInstance = (Server as jest.Mock).mock.results[0].value;
      expect(serverInstance.setRequestHandler).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Handling', () => {
    it('should exit with status 1 on server error', async () => {
      // Mock server.connect to throw an error
      (Server as jest.Mock).mockImplementationOnce(() => ({
        setRequestHandler: jest.fn(),
        connect: jest.fn().mockRejectedValue(new Error('Test error'))
      }));
      
      // Import the main module again to trigger the error
      await import('../src/index.js');
      
      // Expect process.exit to have been called with status 1
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});