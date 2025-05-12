# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mother Goose is a Model Context Protocol (MCP) server that provides an interface for running Goose commands and managing child processes (goslings). It enables:

- Running Goose commands with custom prompts
- Managing multiple concurrent Goose processes
- Monitoring process status and output
- Terminating processes when needed

## Development Commands

### Building the Project

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run watch
```

### Testing

```bash
# Run all tests
npm test

# Run specific test files
npm test -- tests/basic.test.ts

# Test with the MCP Inspector
npm run inspector
```

### Linting

```bash
# Run the linter
npm run lint
```

### CI Build

```bash
# Run the full CI build process (lint, test, build)
./scripts/build.sh
```

## Architecture

The Mother Goose MCP server follows a modular architecture:

### Core Components

1. **GoslingManager (`src/gosling-manager.ts`)**: Manages Goose processes, tracks their state, and handles their lifecycle. It provides methods for creating, retrieving, and terminating Goose processes.

2. **Handlers (`src/handlers.ts`)**: Contains handlers for MCP server requests, including resource listing, resource templates, resource reading, tool listing, and tool execution.

3. **Utils (`src/utils.ts`)**: Contains utility functions, including checking if Goose is installed.

4. **Main Entry Point (`src/index.ts`)**: Sets up the MCP server, registers handlers, and starts the server.

### MCP Resources

The server provides the following resources:

1. `goslings://list`: Lists all running gosling processes.
2. `goslings://{process_id}`: Details about a specific gosling process.
3. `goslings://{process_id}/output`: Current output from a specific gosling process.

### MCP Tools

The server provides the following tools:

1. `run_goose`: Runs a Goose command with the specified prompt.
2. `list_goslings`: Lists all running and completed Goose processes.
3. `get_gosling_output`: Gets the current output from a specific gosling process with pagination support.
4. `send_prompt_to_gosling`: Sends a follow-up prompt to a running gosling process, enabling interactive conversations.
5. `release_gosling`: Releases a specific gosling process when you're done with it.

## Key Implementation Details

1. **Process Management**: Uses Node.js's `child_process` module to spawn and manage Goose processes, collecting their output and providing it through MCP tools and resources.

2. **Interactive Goslings**: Supports sending follow-up prompts to running gosling processes, enabling multi-turn conversations and iterative workflows.

3. **Pagination Support**: Provides Unix-like pagination (similar to `more`/`less`) for viewing large outputs efficiently, with options for jumping to specific sections or viewing the full output.

4. **Prompt History**: Tracks the history of all prompts sent to each gosling process, making it easy to see the conversation flow.

5. **Error Handling**: Comprehensive error handling for process failures, missing Goose installation, and invalid requests.

6. **MCP SDK Integration**: Implements the Model Context Protocol using the `@modelcontextprotocol/sdk` package.

7. **Environment Variables**: Sets up non-ANSI terminal environment variables to ensure proper output formatting.

## Codebase Tips

- The project uses ESM modules (note the `"type": "module"` in package.json).
- Tests are implemented using Jest with TypeScript support through ts-jest.
- The server uses stdio for communication (StdioServerTransport from the MCP SDK).
- Check for Goose installation before starting the server.