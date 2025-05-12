# Mother Goose: Recursive Goose Invocation for MCP

Mother Goose is a Model Context Protocol (MCP) server that enables AI agents to recursively spawn and interact with [Block's Goose CLI](https://block.xyz/docs/goose), creating nested AI instances that can collaborate on complex problems.

![Mother Goose Concept](https://user-images.githubusercontent.com/1100351/244875611-d6b59e30-2ea5-4f71-8307-c19f95f9c5b4.png)

## What is Mother Goose?

Mother Goose allows AI agents (like Claude in Anthropic Console) to:

1. **Spawn child AI instances** using Goose CLI
2. **Manage multiple "goslings" in parallel** for collaborative problem-solving
3. **Monitor subprocess status and output** in real-time
4. **Terminate child processes** when they're no longer needed

This creates a powerful recursive capability where an AI can delegate subtasks to other AI instances, enabling more complex workflows and reasoning chains.

## Prerequisites

Before using Mother Goose, you need:

1. **Node.js v16 or higher**
2. **[Block Goose CLI](https://block.xyz/docs/goose) installed and configured**
   - Make sure you have a working Goose installation
   - Verify you can run `goose run --text "Hello"` from your terminal

## Quick Start

The fastest way to use Mother Goose is with npx:

```bash
# Run validation to check prerequisites
npx mother-goose validate

# Run the MCP server
npx mother-goose
```

## Installation

For a persistent installation:

```bash
# Install globally
npm install -g mother-goose

# Run validation to check prerequisites  
mother-goose validate

# Start the server
mother-goose
```

Or install locally:

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

## Configuration with MCP Clients

To use Mother Goose with an MCP client (like Anthropic Claude), add it to your MCP configuration:

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

If you've installed globally:

```json
{
  "mcpServers": {
    "mother-goose": {
      "command": "mother-goose",
      "args": [],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If you've cloned the repo:

```json
{
  "mcpServers": {
    "mother-goose": {
      "command": "node",
      "args": ["/path/to/mother-goose/build/index.js"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## MCP Tools

Mother Goose provides the following tools to MCP clients:

### 1. `run_goose`

Spawns a new Goose process with the specified prompt.

**Parameters:**
- `prompt`: The prompt to send to Goose
- `options`: Optional parameters for Goose (e.g., `["-t"]` for text-only mode)

**Example:**
```
Use the run_goose tool to research quantum computing.
```

### 2. `list_goslings`

Lists all running and completed Goose processes.

**Parameters:**
- `status`: Filter by status ("all", "running", "completed", "error")

**Example:**
```
Use the list_goslings tool to see all active processes.
```

### 3. `get_gosling_output`

Gets the current output from a specific gosling process.

**Parameters:**
- `process_id`: ID of the gosling process

**Example:**
```
Use the get_gosling_output tool to check the results from process 123e4567-e89b-12d3-a456-426614174000.
```

### 4. `release_gosling`

Releases a specific gosling process when you're done with it.

**Parameters:**
- `process_id`: ID of the gosling process to release

**Example:**
```
Use the release_gosling tool to release process 123e4567-e89b-12d3-a456-426614174000.
```

## MCP Resources

The server provides the following resources:

1. **`goslings://list`**: Lists all running gosling processes
2. **`goslings://{process_id}`**: Details about a specific gosling process
3. **`goslings://{process_id}/output`**: Current output from a specific gosling process

## Usage Examples

### Basic Usage

After configuring Mother Goose with your MCP client, you can:

1. **Start a child Goose process:**
   ```
   Use the run_goose tool to investigate the latest trends in renewable energy.
   ```

2. **Check the status of all processes:**
   ```
   Use the list_goslings tool to see all active processes.
   ```

3. **Retrieve output from a specific process:**
   ```
   Use the get_gosling_output tool to check the results from process [ID].
   ```

4. **Release a process when finished:**
   ```
   Use the release_gosling tool to release process [ID].
   ```

### Advanced Recursive Usage

Mother Goose enables powerful recursive AI workflows:

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

### Linting

```bash
npm run lint
```

## Architecture

Mother Goose follows a modular architecture:

```
┌─────────────────┐      ┌───────────────────┐
│                 │      │                   │
│   MCP Client    │◄────►│   Mother Goose    │
│   (e.g. Claude) │      │   MCP Server      │
│                 │      │                   │
└─────────────────┘      └───────┬───────────┘
                                 │
                                 ▼
                         ┌───────────────────┐
                         │                   │
                         │ Gosling Processes │
                         │ (Child Goose CLI) │
                         │                   │
                         └───────────────────┘
```

The server uses Node.js's child_process module to spawn and manage Goose processes, collecting their output and providing it through MCP tools and resources.

## Troubleshooting

If you encounter issues:

1. **Validate your setup**: Run `npx mother-goose validate` to check prerequisites
2. **Verify Goose works**: Ensure you can run `goose run --text "Hello"` directly
3. **Check MCP configuration**: Make sure your MCP client is correctly configured
4. **Inspect environment variables**: Ensure no conflicting environment variables are set

## License

MIT