#!/usr/bin/env node

/**
 * Validation script runner for Mother Goose MCP Server
 * 
 * This script is a simple entry point to run the validation script
 * from the command line when installed via npm.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the validation script
const validationScriptPath = resolve(__dirname, '../scripts/validate-setup.js');

// Run the validation script as a child process
const validationProcess = spawn('node', [validationScriptPath], {
  stdio: 'inherit'
});

// Handle process exit
validationProcess.on('exit', (code) => {
  process.exit(code);
});

// Handle process errors
validationProcess.on('error', (err) => {
  console.error('Failed to run validation script:', err);
  process.exit(1);
});