#!/usr/bin/env node

/**
 * Validation script for Mother Goose MCP Server
 * 
 * This script checks if all prerequisites are installed and configured properly:
 * 1. Checks if Goose CLI is installed
 * 2. Tests if Goose can execute a simple query
 * 3. Verifies MCP environment configuration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { createSpinner } from 'nanospinner';

const execPromise = promisify(exec);

async function validateSetup() {
  console.log('🔍 Validating Mother Goose setup...\n');
  
  // Check if Goose is installed
  const gooseSpinner = createSpinner('Checking if Goose CLI is installed...').start();
  try {
    const { stdout } = await execPromise('goose --version');
    gooseSpinner.success({ text: `✅ Goose CLI is installed: ${stdout.trim()}` });
  } catch (error) {
    gooseSpinner.error({ text: '❌ Goose CLI is not installed or not in PATH' });
    console.error('\n🛑 Error: Mother Goose requires Goose CLI to be installed.');
    console.log('\nTo install Goose:');
    console.log('1. Visit: https://block.xyz/docs/goose');
    console.log('2. Follow the installation instructions for your platform');
    console.log('\nAfter installation, ensure Goose is in your PATH and try again.');
    process.exit(1);
  }
  
  // Test if Goose can execute a simple query
  const testSpinner = createSpinner('Testing Goose CLI with a simple query...').start();
  try {
    // Use the simplest form of the command to be compatible with all Goose versions
    await execPromise('goose run --text "Say hello!"');
    testSpinner.success({ text: '✅ Goose CLI can execute queries successfully' });
  } catch (error) {
    // If the command exists but returns an error, we'll continue with a warning
    if (error.message.includes('error:') || error.message.includes('ERR!') ||
        error.message.includes('unexpected argument') || error.message.includes('not recognized')) {
      testSpinner.warn({ text: '⚠️ Goose CLI is installed but may have different parameters' });
      console.log('\nNote: There were errors when testing Goose CLI:');
      console.log(`${error.message.split('\n')[0]}`);
      console.log('\nWe\'ll continue anyway, but if you encounter issues:');
      console.log('1. Check your Goose CLI version with: goose --version');
      console.log('2. Ensure Goose can run a basic command: goose run --text "Hello"');
      console.log('3. If you have an older Goose version, try: goose run "Hello"');
    } else {
      testSpinner.error({ text: '❌ Failed to execute a test query with Goose' });
      console.error('\n🛑 Error: Could not run a test query with Goose.');
      console.log('\nPlease check your Goose configuration:');
      console.log('1. Ensure you have a valid API key configured');
      console.log('2. Check your network connection');
      console.log('3. Try running `goose run --text "Hello"` manually to troubleshoot');
      process.exit(1);
    }
  }
  
  // Check for runaway Goose processes
  const processSpinner = createSpinner('Checking for runaway Goose processes...').start();
  try {
    const { stdout } = await execPromise('ps aux | grep goose | grep -v grep');
    if (stdout.trim()) {
      processSpinner.warn({ text: '⚠️ Found running Goose processes that might need termination' });
      console.log('\nRunning Goose processes:');
      console.log(stdout);
      console.log('\nYou may want to terminate these processes if they are not needed:');
      console.log('- Use the terminate_all_goslings tool in Mother Goose');
      console.log('- Or manually terminate with: kill <PID>');
    } else {
      processSpinner.success({ text: '✅ No runaway Goose processes found' });
    }
  } catch (error) {
    // No processes found is success
    processSpinner.success({ text: '✅ No runaway Goose processes found' });
  }

  // Check MCP configuration
  const mcpSpinner = createSpinner('Checking MCP configuration...').start();
  try {
    // Check if 'mcp' command is available (optional)
    try {
      await execPromise('mcp --version');
      mcpSpinner.success({ text: '✅ MCP CLI is installed and can be used with Mother Goose' });
      
      // Provide recommendation for MCP settings
      console.log('\n💡 Recommendation:');
      console.log('To add Mother Goose to your MCP settings:');
      console.log(`
{
  "mcpServers": {
    "mother-goose": {
      "command": "npx mother-goose",
      "args": [],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
`);
    } catch (error) {
      // MCP CLI is not required, so this is just information
      mcpSpinner.warn({ text: 'ℹ️ MCP CLI is not installed (optional)' });
      console.log('\nNote: MCP CLI is not required for Mother Goose to function, but it can be useful for testing.');
    }
  } catch (error) {
    mcpSpinner.error({ text: '❌ Failed to check MCP configuration' });
    console.error(`\n🛑 Error: ${error.message}`);
  }
  
  console.log('\n🎉 Validation complete! Mother Goose is ready to run.');
  console.log('To start using Mother Goose, run: npx mother-goose');
}

// Run validation
validateSetup().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});