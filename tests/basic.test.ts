/**
 * Basic tests for utilities and components
 */

// Make sure our Goose utility returns proper type
import { checkGooseInstalled } from '../src/utils.js';

describe('Mother Goose Utilities', () => {
  test('checkGooseInstalled returns a string or boolean', async () => {
    const result = await checkGooseInstalled();
    expect(typeof result === 'boolean' || typeof result === 'string').toBe(true);
  });
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