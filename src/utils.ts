/**
 * Utility functions for the Mother Goose MCP Server
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execPromise = promisify(exec);

/**
 * Check if the Goose CLI is installed and accessible
 * @returns Promise that resolves to true if Goose is installed and working, or an error message if not
 */
export async function checkGooseInstalled(): Promise<true | string> {
  try {
    // Try to execute 'goose --version' to check if Goose is installed
    const { stdout } = await execPromise('goose --version');
    
    // Log the version information
    console.error(`Found Goose CLI: ${stdout.trim()}`);
    
    // Check if we can actually run a minimal Goose command
    try {
      // Test if Goose can actually execute a simple query with a timeout
      const maxWaitTime = 10000; // 10 seconds timeout
      await execPromise(`goose run --text "test" --max-tokens 1`, { timeout: maxWaitTime });
      return true;
    } catch (testError) {
      const error = testError as Error;
      
      // Handle different types of test execution errors
      if (error.message.includes('timeout')) {
        return 'Goose CLI is installed but timed out when executing a test command. Check your API key configuration or network connection.';
      }
      
      return `Goose CLI is installed but failed a test execution: ${error.message}`;
    }
  } catch (err) {
    const error = err as Error;
    
    // If the command wasn't found, provide a helpful error message
    if (error.message.includes('command not found') || error.message.includes('not recognized')) {
      return getInstallInstructions();
    }
    
    // For other errors, return the error message
    return `Error checking for Goose: ${error.message}`;
  }
}

/**
 * Get platform-specific installation instructions for Goose CLI
 */
function getInstallInstructions(): string {
  const os = platform();
  let instructions = 'Goose CLI is not installed or not in PATH. ';
  
  instructions += 'Please install Goose CLI from: https://block.xyz/docs/goose\n\n';
  
  // Add platform-specific instructions
  switch (os) {
    case 'darwin':
      instructions += 'For macOS, you can install with:\n';
      instructions += '  curl -sSL https://raw.githubusercontent.com/blockprotocol/goose/main/install.sh | bash\n';
      break;
    case 'linux':
      instructions += 'For Linux, you can install with:\n';
      instructions += '  curl -sSL https://raw.githubusercontent.com/blockprotocol/goose/main/install.sh | bash\n';
      break;
    case 'win32':
      instructions += 'For Windows, visit the Goose CLI website for installation instructions.\n';
      break;
    default:
      instructions += 'Visit the Goose CLI website for installation instructions.\n';
  }
  
  instructions += '\nAfter installation, ensure Goose is in your PATH and run the validation script.';
  return instructions;
}

/**
 * Format a date for display
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Calculate duration between two dates
 * @param start Start date
 * @param end End date (defaults to now)
 * @returns Formatted duration string
 */
export function formatDuration(start: Date, end: Date = new Date()): string {
  const durationMs = end.getTime() - start.getTime();
  const seconds = Math.floor(durationMs / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}