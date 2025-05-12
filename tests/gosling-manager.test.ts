/**
 * Tests for the GoslingManager class
 */
import { GoslingManager, Gosling } from '../src/gosling-manager.js';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

// Mock the spawn function
jest.mock('child_process', () => {
  return {
    spawn: jest.fn(() => {
      const mockProcess = new EventEmitter() as ChildProcess;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();
      return mockProcess;
    })
  };
});

// Mock randomUUID
jest.mock('crypto', () => {
  return {
    randomUUID: jest.fn(() => 'test-uuid')
  };
});

// Mock console.error to not clutter test output
console.error = jest.fn();

describe('GoslingManager', () => {
  let manager: GoslingManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    manager = new GoslingManager();
  });
  
  describe('runGoose', () => {
    it('should create a new Gosling process with the given prompt', async () => {
      const { spawn } = require('child_process');
      
      const gosling = await manager.runGoose('Hello world');
      
      expect(spawn).toHaveBeenCalledWith('goose', ['run', '--text', 'Hello world'], expect.any(Object));
      expect(gosling).toEqual(expect.objectContaining({
        id: 'test-uuid',
        prompt: 'Hello world',
        options: [],
        status: 'running',
        output: '',
        error: ''
      }));
      
      // Gosling should be stored in the manager
      expect(manager.getGosling('test-uuid')).toBe(gosling);
    });
    
    it('should include options in the command if provided', async () => {
      const { spawn } = require('child_process');
      
      await manager.runGoose('Hello world', ['-o', 'option-value']);
      
      expect(spawn).toHaveBeenCalledWith(
        'goose', 
        ['run', '-o', 'option-value', '--text', 'Hello world'], 
        expect.any(Object)
      );
    });
    
    it('should collect stdout and stderr', async () => {
      const { spawn } = require('child_process');
      const mockProcess = spawn();
      
      const gosling = await manager.runGoose('Hello world');
      
      // Simulate data on stdout and stderr
      mockProcess.stdout.emit('data', Buffer.from('Output data'));
      mockProcess.stderr.emit('data', Buffer.from('Error data'));
      
      expect(gosling.output).toBe('Output data');
      expect(gosling.error).toBe('Error data');
    });
    
    it('should handle process exit with code 0', async () => {
      const { spawn } = require('child_process');
      const mockProcess = spawn();
      
      const gosling = await manager.runGoose('Hello world');
      
      // Simulate process exit
      mockProcess.emit('exit', 0);
      
      expect(gosling.status).toBe('completed');
      expect(gosling.endTime).toBeInstanceOf(Date);
    });
    
    it('should handle process exit with non-zero code', async () => {
      const { spawn } = require('child_process');
      const mockProcess = spawn();
      
      const gosling = await manager.runGoose('Hello world');
      
      // Simulate process exit with error
      mockProcess.emit('exit', 1);
      
      expect(gosling.status).toBe('error');
      expect(gosling.endTime).toBeInstanceOf(Date);
    });
    
    it('should handle process errors', async () => {
      const { spawn } = require('child_process');
      const mockProcess = spawn();
      
      const gosling = await manager.runGoose('Hello world');
      
      // Simulate process error
      mockProcess.emit('error', new Error('Process error'));
      
      expect(gosling.status).toBe('error');
      expect(gosling.error).toBe('Process error');
    });
  });
  
  describe('getGosling', () => {
    it('should return the Gosling with the given ID', async () => {
      const gosling = await manager.runGoose('Hello world');
      expect(manager.getGosling('test-uuid')).toBe(gosling);
    });
    
    it('should return undefined for non-existent ID', () => {
      expect(manager.getGosling('non-existent-id')).toBeUndefined();
    });
  });
  
  describe('getAllGoslings', () => {
    it('should return all Goslings', async () => {
      const gosling = await manager.runGoose('Hello world');
      expect(manager.getAllGoslings()).toEqual([gosling]);
    });
    
    it('should return an empty array when no Goslings exist', () => {
      expect(manager.getAllGoslings()).toEqual([]);
    });
  });
  
  describe('terminateGosling', () => {
    it('should terminate a running Gosling', async () => {
      const gosling = await manager.runGoose('Hello world');
      const { spawn } = require('child_process');
      const mockProcess = spawn();
      
      const result = manager.terminateGosling('test-uuid');
      
      expect(result).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalled();
      expect(gosling.status).toBe('completed');
      expect(gosling.endTime).toBeInstanceOf(Date);
    });
    
    it('should return false for non-existent ID', () => {
      expect(manager.terminateGosling('non-existent-id')).toBe(false);
    });
    
    it('should not call kill for already completed Goslings', async () => {
      const gosling = await manager.runGoose('Hello world');
      const { spawn } = require('child_process');
      const mockProcess = spawn();
      
      // Mark the gosling as completed
      gosling.status = 'completed';
      gosling.endTime = new Date();
      
      const result = manager.terminateGosling('test-uuid');
      
      expect(result).toBe(true);
      expect(mockProcess.kill).not.toHaveBeenCalled();
    });
  });
});