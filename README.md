# Mother Goose: Recursive Goose Invocation for MCP

Mother Goose is a Model Context Protocol (MCP) server that enables AI agents to recursively spawn and interact with [Block's Goose CLI](https://block.xyz/docs/goose), creating nested AI instances that can collaborate on complex problems.

<p align="center">
  <img src="./docs/goose.png" alt="Mother Goose Logo" width="300">
</p>

## What is Mother Goose?

Mother Goose allows AI agents (like Claude in Anthropic Console) to:

1. **Spawn child AI instances** using Goose CLI
2. **Manage multiple "goslings" in parallel** for collaborative problem-solving
3. **Monitor subprocess status and output** in real-time, with pagination for large outputs
4. **Have interactive conversations** with running gosling processes via follow-up prompts
5. **Release child processes** when they're no longer needed

This creates a powerful recursive capability where an AI can delegate subtasks to other AI instances and have ongoing conversations with them, enabling more complex workflows and interactive reasoning chains.

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

Gets the current output from a specific gosling process with pagination support.

**Example:**
```
# Basic usage
Use the get_gosling_output tool to check the results from process [ID].

# With pagination (Unix more/less style)
Use the get_gosling_output tool with offset=100 and limit=50 to view lines 100-150.

# Get full output
Use the get_gosling_output tool with full_output=true to get the complete output.
```

### 4. `get_gosling_status`

Gets a compact activity report of goslings with their current working status (working/idle), helping prevent context overwhelm when managing multiple processes.

**Example:**
```
# Get status of all goslings
Use the get_gosling_status tool to see which goslings are ready for interaction.

# Get status of a specific gosling
Use the get_gosling_status tool with process_id="[ID]" to check if it's idle yet.
```

### 5. `send_prompt_to_gosling`

Sends a follow-up prompt to a running gosling process in interactive mode, enabling multi-turn conversations. Goslings are automatically started in interactive mode, so they stay alive and can receive multiple prompts.

**Example:**
```
Use the send_prompt_to_gosling tool to ask the gosling at process [ID] to elaborate on its findings.
```

### 6. `release_gosling`

Releases a specific gosling process when you're done with it.

**Example:**
```
Use the release_gosling tool to release process [ID].
```

## Usage Examples

After configuring Mother Goose with your MCP client, you can create recursive AI workflows:

### Basic Recursive Workflow

```
I need to solve a complex machine learning problem. Use the run_goose tool to create three specialist goslings:
1. One to research the latest papers on this topic
2. One to design an experimental approach
3. One to draft code snippets for implementation

Then, I'll coordinate their efforts to produce a comprehensive solution.
```

### Interactive Conversations with Goslings

You can have multi-turn conversations with running goslings, providing feedback or additional instructions:

```
# Create a gosling to work on a task
Use the run_goose tool to create a gosling for drafting a research proposal.

# Check initial progress
Use the get_gosling_output tool to see the gosling's progress.

# Send follow-up instructions
Use the send_prompt_to_gosling tool to refine the focus: "Please emphasize the methodology section and expand on the data collection approach."

# Check updated output
Use the get_gosling_output tool to see how the gosling incorporated your feedback.

# Continue the conversation
Use the send_prompt_to_gosling tool again: "Now please add a budget section with estimated costs."
```

### Efficient Management of Multiple Goslings

Use the activity sensor to manage multiple goslings efficiently without overwhelming your context:

```
# Start multiple goslings for different tasks
Use the run_goose tool to create three specialist goslings for different parts of a complex project.

# Check which goslings are ready for interaction
Use the get_gosling_status tool to see a compact report of all goslings.

# Only interact with idle goslings
For each gosling marked as 'idle' in the status report:
1. Review their output using get_gosling_output
2. Send follow-up prompts as needed using send_prompt_to_gosling

# Check activity status again
Use the get_gosling_status tool again to see which goslings have finished processing.

# This prevents context overflow by only retrieving complete outputs when necessary
```

### Advanced: Shared Memory Coordination

When combined with [Memory Graph](https://github.com/aaronsb/memory-graph), all goslings can share knowledge through structured memory domains:

```
# Create specialized goslings that share a common memory structure
Use the run_goose tool to create a research gosling that stores findings in the shared memory.
Use the run_goose tool to create an implementation gosling that builds upon those findings.
Use the run_goose tool to create a testing gosling that validates the implementation.

# Each gosling can read, write, and follow connections in the shared memory
```

See [Advanced Usage](./docs/usage/advanced-usage.md#shared-memory-with-memory-graph) for more details.

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