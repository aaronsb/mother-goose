#!/usr/bin/env node

/**
 * Mother Goose MCP Server
 * 
 * This MCP server enables AI agents to recursively spawn and interact with Goose CLI,
 * creating nested AI instances that can collaborate on complex problems.
 * 
 * Prerequisites:
 * - Node.js v16+
 * - Block Goose CLI installed and configured
 * 
 * To validate your setup:
 *   npx mother-goose validate
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { GoslingManager } from "./gosling-manager.js";
import { checkGooseInstalled } from "./utils.js";
import {
  handleListResources,
  handleListResourceTemplates,
  handleReadResource,
  handleListTools,
  handleCallTool
} from "./handlers.js";

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('Mother Goose MCP Server v0.1.0');
  process.exit(0);
}

if (args.includes('validate')) {
  console.log('Please run the validation script:');
  console.log('npm run validate');
  console.log('or:');
  console.log('node ./scripts/validate-setup.js');
  process.exit(0);
}

// Create the Gosling manager
const goslingManager = new GoslingManager();

/**
 * Create an MCP server with capabilities for resources and tools
 */
const server = new Server(
  {
    name: "mother-goose",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * Register request handlers
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return handleListResources(goslingManager);
});

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return handleListResourceTemplates();
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return handleReadResource(goslingManager, request);
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return handleListTools();
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return handleCallTool(goslingManager, request);
});

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Mother Goose MCP Server v0.1.0
==============================

An MCP server that enables AI agents to recursively spawn Goose CLI instances.

Usage:
  mother-goose [options]
  npx mother-goose [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version information
  validate       Run the validation script to check prerequisites

Prerequisites:
  - Node.js v16+
  - Block Goose CLI installed and configured

For more information, visit: https://github.com/aaronsb/mother-goose
  `);
}

/**
 * Start the server using stdio transport
 */
async function main() {
  // Display banner
  console.error(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Mother Goose MCP Server v0.1.0                          ║
║   Recursive Goose Invocation for AI Agents                ║
║                                                           ║
║   GitHub: https://github.com/aaronsb/mother-goose         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Check if Goose is installed
  console.error('Checking Goose CLI installation...');
  const gooseCheck = await checkGooseInstalled();
  if (gooseCheck !== true) {
    console.error("\n❌ Error:", gooseCheck);
    console.error("\nTo install Goose CLI:");
    console.error("1. Visit: https://block.xyz/docs/goose");
    console.error("2. Follow the installation instructions for your platform");
    console.error("\nTo validate your setup, run: npx mother-goose validate");
    process.exit(1);
  }
  console.error('✅ Goose CLI is installed');

  console.error('\nStarting Mother Goose MCP server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Mother Goose MCP server running on stdio');
  console.error('Ready to receive MCP requests');
}

// Handle errors during startup
main().catch((error) => {
  console.error("\n❌ Server error:", error);
  console.error("\nTo troubleshoot:");
  console.error("1. Ensure Goose CLI is installed and working");
  console.error("2. Check your MCP client configuration");
  console.error("3. Run validation: npx mother-goose validate");
  process.exit(1);
});

export default main;