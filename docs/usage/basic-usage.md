# Basic Usage

This guide covers the basic usage of Mother Goose with MCP clients.

## Overview

Mother Goose enables AI agents (like Claude) to spawn and manage child Goose processes. This creates a powerful recursive capability where an AI agent can delegate subtasks to other AI instances.

## Using Mother Goose Tools

Mother Goose provides four main tools:

### 1. Creating a Gosling Process

To start a new Goose process (gosling):

```
Use the run_goose tool to [your prompt here].
```

For example:
```
Use the run_goose tool to research the latest developments in quantum computing.
```

The tool will return a process ID that you can use to reference this gosling later.

### 2. Listing Gosling Processes

To see all running and completed gosling processes:

```
Use the list_goslings tool to see all active processes.
```

You can also filter by status:
```
Use the list_goslings tool with status="running" to see only running processes.
```

Status options: "all", "running", "completed", "error"

### 3. Getting Process Output

To get the current output from a specific gosling process:

```
Use the get_gosling_output tool to check the results from process [ID].
```

Replace `[ID]` with the actual process ID from the `run_goose` or `list_goslings` results.

### 4. Releasing a Process

When you're done with a gosling process, you can release it:

```
Use the release_gosling tool to release process [ID].
```

This frees up system resources but still allows you to access the output from the process.

## Example Workflow

Here's a complete example workflow:

1. Start a gosling process:
   ```
   Use the run_goose tool to find information about sustainable energy sources.
   ```

2. Get the process ID from the response:
   ```
   Started Goose process with ID: 123e4567-e89b-12d3-a456-426614174000
   ```

3. Check the status of all processes:
   ```
   Use the list_goslings tool to see all active processes.
   ```

4. Get the output from your specific process:
   ```
   Use the get_gosling_output tool to check the results from process 123e4567-e89b-12d3-a456-426614174000.
   ```

5. When done, release the process:
   ```
   Use the release_gosling tool to release process 123e4567-e89b-12d3-a456-426614174000.
   ```

## Next Steps

- [Advanced Usage](./advanced-usage.md)
- [Troubleshooting](./troubleshooting.md)
- [MCP Tools Reference](../reference/tools.md)