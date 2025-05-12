# Mother Goose: Recursive Goose Invocation for MCP

Mother Goose is a Model Context Protocol (MCP) server that enables AI agents to recursively spawn and interact with [Block's Goose CLI](https://block.xyz/docs/goose), creating nested AI instances that can collaborate on complex problems.

![Mother Goose Concept](https://user-images.githubusercontent.com/1100351/244875611-d6b59e30-2ea5-4f71-8307-c19f95f9c5b4.png)

## What is Mother Goose?

Mother Goose allows AI agents (like Claude in Anthropic Console) to:

1. **Spawn child AI instances** using Goose CLI
2. **Manage multiple "goslings" in parallel** for collaborative problem-solving
3. **Monitor subprocess status and output** in real-time
4. **Release child processes** when they're no longer needed

This creates a powerful recursive capability where an AI can delegate subtasks to other AI instances, enabling more complex workflows and reasoning chains.

## Documentation

For detailed documentation, please refer to the following resources:

### Getting Started
- [Installation Guide](./docs/getting-started/installation.md)
- [Configuration Guide](./docs/getting-started/configuration.md)
- [Quick Start Guide](./docs/getting-started/quick-start.md)

### Usage
- [Basic Usage](./docs/usage/basic-usage.md)
- [Advanced Usage](./docs/usage/advanced-usage.md)
- [Troubleshooting](./docs/usage/troubleshooting.md)

### Reference
- [MCP Tools Reference](./docs/reference/tools.md)
- [MCP Resources Reference](./docs/reference/resources.md)
- [Architecture Reference](./docs/reference/architecture.md)

## Quick Start

The fastest way to use Mother Goose is with npx:

```bash
# Run validation to check prerequisites
npx mother-goose validate

# Run the MCP server
npx mother-goose
```

## Prerequisites

Before using Mother Goose, you need:

1. **Node.js v16 or higher**
2. **[Block Goose CLI](https://block.xyz/docs/goose) installed and configured**
   - Make sure you have a working Goose installation
   - Verify you can run `goose run --text "Hello"` from your terminal

## MCP Tools

Mother Goose provides the following tools to MCP clients:

### 1. `run_goose`

Spawns a new Goose process with the specified prompt.

**Example:**
```
Use the run_goose tool to research quantum computing.
```

### 2. `list_goslings`

Lists all running and completed Goose processes.

**Example:**
```
Use the list_goslings tool to see all active processes.
```

### 3. `get_gosling_output`

Gets the current output from a specific gosling process.

**Example:**
```
Use the get_gosling_output tool to check the results from process [ID].
```

### 4. `release_gosling`

Releases a specific gosling process when you're done with it.

**Example:**
```
Use the release_gosling tool to release process [ID].
```

## Usage Example

After configuring Mother Goose with your MCP client, you can create recursive AI workflows:

```
I need to solve a complex machine learning problem. Use the run_goose tool to create three specialist goslings:
1. One to research the latest papers on this topic
2. One to design an experimental approach
3. One to draft code snippets for implementation

Then, I'll coordinate their efforts to produce a comprehensive solution.
```

## Development

### Running in Development Mode

For development, you can use the watch mode:

```bash
npm run watch
```

### Testing with the MCP Inspector

You can test the server using the MCP Inspector:

```bash
npm run inspector
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- tests/basic.test.ts
```

## License

MIT