# Mother Goose MCP Server

A Model Context Protocol (MCP) server that allows an agent to call Goose and manage child processes (goslings).

## Overview

The Mother Goose MCP server provides a structured interface for running Goose commands and managing the resulting processes. It enables:

- Running Goose commands with custom prompts
- Managing multiple concurrent Goose processes (goslings)
- Monitoring process status and output
- Terminating processes when needed

## Features

### MCP Tools

The server provides the following tools:

1. **`run_goose`**
   - Creates a new Goose process with the specified prompt
   - Returns process ID and initial output
   - Parameters:
     - `prompt`: The prompt to send to Goose
     - `options`: Optional parameters for Goose (e.g., ["-t"] for text-only mode)

2. **`list_goslings`**
   - Lists all running and completed Goose processes
   - Parameters:
     - `status`: Filter by status ("all", "running", "completed", "error")

3. **`get_gosling_output`**
   - Gets the current output from a specific gosling process
   - Parameters:
     - `process_id`: ID of the gosling process

4. **`terminate_gosling`**
   - Terminates a specific gosling process
   - Parameters:
     - `process_id`: ID of the gosling process to terminate

### MCP Resources

The server provides the following resources:

1. **`goslings://list`**
   - Lists all running gosling processes

2. **`goslings://{process_id}`**
   - Details about a specific gosling process

3. **`goslings://{process_id}/output`**
   - Current output from a specific gosling process

## Installation

### Prerequisites

- Node.js (v16 or higher)
- Goose CLI installed and available in your PATH

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mother-goose.git
   cd mother-goose
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Adding to MCP Settings

To use the Mother Goose MCP server with Cline, add it to your MCP settings configuration file:

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

Replace `/path/to/mother-goose` with the actual path to your Mother Goose installation.

### Example Usage

Once the server is configured, you can use it through Cline with commands like:

```
Use the run_goose tool to search the internet for today's news.
```

This will create a new Goose process and return a process ID. You can then use:

```
Use the get_gosling_output tool to check the results from process [ID].
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

## Architecture

The Mother Goose MCP server follows a modular architecture:

```
┌─────────────────┐      ┌───────────────────┐
│                 │      │                   │
│   MCP Client    │◄────►│   Mother Goose    │
│                 │      │   MCP Server      │
│                 │      │                   │
└─────────────────┘      └───────┬───────────┘
                                 │
                                 ▼
                         ┌───────────────────┐
                         │                   │
                         │ Gosling Processes │
                         │                   │
                         └───────────────────┘
```

The server uses Node.js's child_process module to spawn and manage Goose processes, collecting their output and providing it through MCP tools and resources.

## License

MIT
