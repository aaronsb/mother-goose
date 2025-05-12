/**
 * Basic tests for utilities and components
 */

// Import utility functions
import { formatDate, formatDuration } from '../src/utils.js';

describe('Mother Goose Utilities', () => {
  test('formatDate formats dates correctly', () => {
    const date = new Date('2023-01-01T12:34:56.789Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('2023-01-01 12:34:56');
  });
  
  test('formatDuration formats durations correctly', () => {
    // Create dates 2 hours and 15 minutes apart
    const start = new Date('2023-01-01T10:00:00.000Z');
    const end = new Date('2023-01-01T12:15:00.000Z');
    
    const formatted = formatDuration(start, end);
    expect(formatted).toBe('2h 15m');
  });
  
  // Skip the actual Goose check since it's not reliable in test environments
});

// Test that the GoslingManager class is properly constructed
import { GoslingManager } from '../src/gosling-manager.js';

describe('GoslingManager', () => {
  test('can be instantiated', () => {
    const manager = new GoslingManager();
    expect(manager).toBeInstanceOf(GoslingManager);
  });
  
  test('getAllGoslings returns an array', () => {
    const manager = new GoslingManager();
    const goslings = manager.getAllGoslings();
    expect(Array.isArray(goslings)).toBe(true);
  });
  
  test('getGosling returns undefined for non-existent ID', () => {
    const manager = new GoslingManager();
    const gosling = manager.getGosling('non-existent-id');
    expect(gosling).toBeUndefined();
  });
  
  test('terminateGosling returns false for non-existent ID', () => {
    const manager = new GoslingManager();
    const result = manager.terminateGosling('non-existent-id');
    expect(result).toBe(false);
  });
});