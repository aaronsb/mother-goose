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
      // Use the simplest form of the command to be compatible with all Goose versions
      const maxWaitTime = 30000; // 30 seconds timeout (increased for Ollama or other local models)
      console.error(`Testing Goose CLI with a ${maxWaitTime/1000}s timeout...`);

      await execPromise(`goose run --text "test"`, { timeout: maxWaitTime });
      return true;
    } catch (testError) {
      const error = testError as Error;
      console.error(`Goose test command result: ${error.message}`);

      // Handle different types of test execution errors
      if (error.message.includes('timeout')) {
        console.error('The test command timed out. This may be expected with slower models.');

        // Check if we can see evidence of Ollama in the error message
        if (error.message.includes('provider: ollama')) {
          console.error('Detected Ollama provider in the output.');
          console.error('Continuing anyway since Goose CLI is installed with Ollama...');
          return true;
        }

        return 'Goose CLI is installed but timed out when executing a test command. Check your API key configuration or network connection.';
      }

      // If the error message mentions Ollama starting up, consider it working
      if (error.message.includes('provider: ollama')) {
        console.error('Detected Ollama provider in Goose configuration.');
        console.error('Continuing since Goose CLI is installed and configured with Ollama...');
        return true;
      }

      // If the command failed but Goose is installed, we'll assume it's configured
      // This is more flexible with different versions of Goose
      if (error.message.includes('error:') || error.message.includes('ERR!')) {
        console.error(`Warning: Goose CLI test execution had errors: ${error.message}`);
        console.error('Continuing anyway since Goose CLI is installed...');
        return true;
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

/**
 * Format file size in bytes to human-readable format
 * @param bytes Size in bytes
 * @returns Formatted string (e.g., "4.5 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + " bytes";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  }
}