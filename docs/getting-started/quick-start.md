# Quick Start Guide

This guide helps you quickly set up and start using Mother Goose, an MCP server that enables AI agents to recursively spawn and interact with Goose CLI.

## Prerequisites

Before you begin, make sure you have:

1. **Node.js v16 or higher** installed
2. **Block Goose CLI** installed and working
   - To check, run: `goose run --text "Hello, world"` in your terminal
   - If not installed, visit: [https://block.xyz/docs/goose](https://block.xyz/docs/goose)

## Install & Run

Choose one of these methods to get started:

### Method 1: Use with npx (Easiest)

```bash
# Run validation to check prerequisites
npx mother-goose validate

# Run the MCP server
npx mother-goose
```

### Method 2: Install Globally

```bash
# Install globally
npm install -g mother-goose

# Run validation
mother-goose validate

# Start the server
mother-goose
```

### Method 3: Clone & Build

```bash
# Clone the repository
git clone https://github.com/aaronsb/mother-goose.git
cd mother-goose

# Install dependencies
npm install

# Run validation
npm run validate

# Build and run
npm run build
node build/index.js
```

## Configure Your MCP Client

Add Mother Goose to your MCP client configuration:

```json
{
  "mcpServers": {
    "mother-goose": {
      "command": "npx",
      "args": ["mother-goose"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Test It Out

Once configured, try these examples with your AI agent:

1. **Start a Goose process:**
   ```
   Use the run_goose tool to search for information about renewable energy technologies.
   ```

2. **List running processes:**
   ```
   Use the list_goslings tool to see all active processes.
   ```

3. **View output from a process:**
   ```
   Use the get_gosling_output tool to check the results from process [ID].
   ```

4. **Release a process when done:**
   ```
   Use the release_gosling tool to release process [ID].
   ```

## Troubleshooting

If you encounter issues:

1. Make sure Goose is installed and working: `goose run --text "Hello"`
2. Check your MCP client configuration
3. Run validation: `npx mother-goose validate`
4. Check the [Troubleshooting Guide](../usage/troubleshooting.md) for more help

## Next Steps

- [Basic Usage](../usage/basic-usage.md)
- [Advanced Usage](../usage/advanced-usage.md)
- [MCP Tools Reference](../reference/tools.md)