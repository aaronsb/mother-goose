# MCP Tools Reference

This document provides detailed reference information for all MCP tools provided by Mother Goose.

## Overview

Mother Goose provides five main tools that enable AI agents to interact with Goose CLI:

1. `run_goose`: Create and start a new Goose process
2. `list_goslings`: List all Goose processes
3. `get_gosling_output`: Get output from a specific process with pagination support
4. `send_prompt_to_gosling`: Send a follow-up prompt to a running gosling process
5. `release_gosling`: Release a specific process

## Tool Details

### `run_goose`

Creates a new Goose process with the specified prompt.

**Parameters:**
- `prompt` (string, required): The prompt to send to Goose
- `options` (array of strings, optional): Optional parameters for Goose (e.g., [`"-t"`] for text-only mode)

**Returns:**
- Process ID and confirmation message

**Example Request:**
```json
{
  "name": "run_goose",
  "arguments": {
    "prompt": "Explain quantum computing in simple terms",
    "options": ["-t"]
  }
}
```

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Started Goose process with ID: 123e4567-e89b-12d3-a456-426614174000\n\nPrompt: \"Explain quantum computing in simple terms\"\n\nThe process is now running. You can check its status and output using:\n- get_gosling_output tool with process_id=\"123e4567-e89b-12d3-a456-426614174000\"\n- Resource URI: goslings://123e4567-e89b-12d3-a456-426614174000/output\n\nThis child Goose process is working on your request in parallel."
    }
  ]
}
```

### `list_goslings`

Lists all running and completed Goose processes.

**Parameters:**
- `status` (string, optional): Filter by status ("all", "running", "completed", "error"). Defaults to "all"

**Returns:**
- List of gosling processes with their details

**Example Request:**
```json
{
  "name": "list_goslings",
  "arguments": {
    "status": "running"
  }
}
```

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 2 gosling processes with status \"running\":\n\nStatus summary: 2 running, 0 completed, 0 error\n\n1. ID: 123e4567-e89b-12d3-a456-426614174000\n   Status: running\n   Runtime: 45s (running)\n   Prompt: \"Explain quantum computing in simple terms\"\n\n2. ID: 234f5678-f90c-23e4-b567-537825693001\n   Status: running\n   Runtime: 15s (running)\n   Prompt: \"Generate a poem about AI\"\n\nTo view output from a specific process:\nUse the get_gosling_output tool with the process_id parameter."
    }
  ]
}
```

### `get_gosling_output`

Gets the current output from a specific gosling process with pagination support for handling large outputs.

**Parameters:**
- `process_id` (string, required): ID of the gosling process
- `offset` (number, optional): Line number to start from (0-indexed). Defaults to 0.
- `limit` (number, optional): Maximum number of lines to return. Defaults to 100.
- `full_output` (boolean, optional): Return complete output regardless of size. Defaults to false.

**Returns:**
- Process details, prompt history, and paginated output

**Example Request:**
```json
{
  "name": "get_gosling_output",
  "arguments": {
    "process_id": "123e4567-e89b-12d3-a456-426614174000",
    "offset": 0,
    "limit": 50
  }
}
```

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "=== Gosling Process 123e4567-e89b-12d3-a456-426614174000 ===\nStatus: running\nStarted: 2023-06-15 14:22:45\nDuration: 1m 15s (running)\nPrompts: 2\n  1. [2023-06-15 14:22:45] \"Explain quantum computing in simple terms\"\n  2. [2023-06-15 14:24:10] \"How does quantum entanglement work?\"\n\n=== Output (1-50 of 150 lines) ===\n\nQuantum computing is a type of computing that uses quantum mechanics to process information. Unlike regular computers that use bits (0s and 1s), quantum computers use quantum bits or 'qubits' which can exist in multiple states at once. This allows quantum computers to solve certain problems much faster than traditional computers.\n\nImagine a regular computer as having to check every path in a maze one at a time, while a quantum computer can check many paths simultaneously. This makes quantum computers potentially very powerful for specific tasks like breaking certain types of encryption, simulating molecules for drug discovery, or optimizing complex systems.\n\n=== Pagination ===\nShowing lines 1 to 50 of 150 total lines.\nTo see more, use:\n  - Next page: offset=50 limit=50\n  - Full output: full_output=true"
    }
  ]
}
```

### `send_prompt_to_gosling`

Sends a follow-up prompt to a running gosling process, enabling interactive multi-turn conversations.

**Parameters:**
- `process_id` (string, required): ID of the gosling process
- `prompt` (string, required): The follow-up prompt to send to the gosling

**Returns:**
- Confirmation message

**Example Request:**
```json
{
  "name": "send_prompt_to_gosling",
  "arguments": {
    "process_id": "123e4567-e89b-12d3-a456-426614174000",
    "prompt": "How does quantum entanglement work?"
  }
}
```

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully sent follow-up prompt to gosling 123e4567-e89b-12d3-a456-426614174000\n\nPrompt #2: \"How does quantum entanglement work?\"\n\nThe gosling is processing your follow-up prompt. You can check its progress using:\n- get_gosling_output tool with process_id=\"123e4567-e89b-12d3-a456-426614174000\"\n- Resource URI: goslings://123e4567-e89b-12d3-a456-426614174000/output\n\nThis allows for interactive, multi-turn conversations with your gosling process."
    }
  ]
}
```

### `release_gosling`

Releases a specific gosling process when you're done with it.

**Parameters:**
- `process_id` (string, required): ID of the gosling process to release

**Returns:**
- Confirmation message

**Example Request:**
```json
{
  "name": "release_gosling",
  "arguments": {
    "process_id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully released gosling process 123e4567-e89b-12d3-a456-426614174000\nThe gosling was active for 2m 30s before being released.\n\nYou can still access its output using get_gosling_output or the resource URI: goslings://123e4567-e89b-12d3-a456-426614174000/output"
    }
  ]
}
```

## Tool Usage Best Practices

1. **Be Specific with Prompts**: When using `run_goose`, provide clear, specific prompts to get better results.

2. **Manage Resources**: Always use `release_gosling` when you're done with a process to free up system resources.

3. **Check Status Regularly**: Use `list_goslings` to monitor the status of all processes, especially for long-running tasks.

4. **Handle Errors Gracefully**: Check for error messages in the output and handle them appropriately.

5. **Use Options Judiciously**: The `options` parameter in `run_goose` can provide more control, but be aware of compatibility with different Goose CLI versions.

6. **Interactive Conversations**: Use `send_prompt_to_gosling` to have multi-turn conversations with running goslings, allowing for clarification, refinement, and follow-up questions.

7. **Paginate Large Outputs**: For goslings with large outputs, use pagination parameters in `get_gosling_output` to view specific sections without overwhelming your context.

## See Also

- [MCP Resources Reference](./resources.md)
- [Basic Usage Guide](../usage/basic-usage.md)
- [Advanced Usage Guide](../usage/advanced-usage.md)