# MCP Tools Reference

This document provides detailed reference information for all MCP tools provided by Mother Goose.

## Overview

Mother Goose provides eight main tools that enable AI agents to interact with Goose CLI:

1. `run_goose`: Create and start a new Goose process
2. `list_goslings`: List all Goose processes
3. `get_gosling_output`: Get output from a specific process with pagination support
4. `get_gosling_status`: Get a compact activity status report (working/idle) for goslings
5. `send_prompt_to_gosling`: Send a follow-up prompt to a running gosling process
6. `release_gosling`: Release a specific process
7. `configure_circuit_breaker`: Configure safety limits to prevent token runaway
8. `terminate_all_goslings`: Emergency killswitch to terminate all running processes

## Tool Details

### `run_goose`

Creates a new Goose process with the specified prompt.

**Parameters:**
- `prompt` (string, required): The prompt to send to Goose

**Returns:**
- Process ID and confirmation message

**Example Request:**
```json
{
  "name": "run_goose",
  "arguments": {
    "prompt": "Explain quantum computing in simple terms"
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

### `get_gosling_status`

Gets a compact activity report of goslings with their working status (working/idle), helping to prevent context overwhelm when managing multiple processes.

**Parameters:**
- `process_id` (string, optional): ID of a specific gosling process to check. If not provided, returns status for all goslings.
- `idle_threshold_ms` (number, optional): Time in milliseconds with no output to consider a gosling idle. Defaults to 2000ms.

**Returns:**
- A compact status report with working/idle indicators and minimal context overhead

**Example Request:**
```json
{
  "name": "get_gosling_status",
  "arguments": {}
}
```

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "=== Gosling Status Report ===\n\nTotal: 3 goslings (1 working, 2 idle)\n\n1. ID: 123e4567-e89b-12d3-a456-426614174000\n   Status: IDLE (No output for 5.2s)\n   Task: \"Explain quantum computing in simple terms\"\n   Last prompt: \"How does quantum entanglement work?\"\n   Output size: 4.5 KB (150 lines)\n\n2. ID: 234f5678-f90c-23e4-b567-537825693001\n   Status: WORKING (Active output generation)\n   Task: \"Generate a poem about AI\"\n   Output size: 1.2 KB (45 lines)\n\n3. ID: 345g6789-h01d-34f5-c678-648936704002\n   Status: IDLE (No output for 12.7s)\n   Task: \"Draft a research plan for renewable energy\"\n   Output size: 8.1 KB (320 lines)\n\nUse get_gosling_output with process_id=\"ID\" to view complete output of idle goslings.\nUse send_prompt_to_gosling with process_id=\"ID\" to continue conversations with idle goslings."
    }
  ]
}
```

**Example Request for Specific Gosling:**
```json
{
  "name": "get_gosling_status",
  "arguments": {
    "process_id": "123e4567-e89b-12d3-a456-426614174000",
    "idle_threshold_ms": 3000
  }
}
```

**Example Response for Specific Gosling:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "=== Gosling Status ===\n\nID: 123e4567-e89b-12d3-a456-426614174000\nStatus: IDLE (No output for 5.2s)\nTask: \"Explain quantum computing in simple terms\"\nLast prompt: \"How does quantum entanglement work?\"\nPrompt count: 2\nOutput size: 4.5 KB (150 lines)\nRuntime: 1m 30s\n\nThis gosling is idle and ready for interaction.\nUse get_gosling_output to view its complete response or send_prompt_to_gosling to continue the conversation."
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

### `configure_circuit_breaker`

Configures safety limits for gosling processes to prevent token runaway. This tool enables you to customize the built-in circuit breaker system that protects against excessive resource consumption.

**Parameters:**
- `enabled` (boolean, optional): Enable or disable the circuit breaker
- `max_active_goslings` (number, optional): Maximum number of concurrent active goslings (default: 5)
- `max_total_goslings` (number, optional): Maximum number of total goslings including completed ones (default: 20)
- `max_runtime_minutes` (number, optional): Maximum runtime in minutes for any single gosling (default: 30)
- `max_output_size_kb` (number, optional): Maximum output size in KB for any single gosling (default: 1024)
- `max_prompts_per_gosling` (number, optional): Maximum number of prompts per gosling (default: 10)
- `auto_terminate_idle_minutes` (number, optional): Auto-terminate goslings idle for this many minutes (default: 10, 0 to disable)

**Returns:**
- Current circuit breaker configuration after update

**Example Request:**
```json
{
  "name": "configure_circuit_breaker",
  "arguments": {
    "max_active_goslings": 3,
    "max_runtime_minutes": 15,
    "auto_terminate_idle_minutes": 5
  }
}
```

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Circuit breaker configuration updated successfully.\n\nCurrent configuration:\n- Enabled: Yes\n- Max active goslings: 3\n- Max total goslings: 20\n- Max runtime: 15 minutes\n- Max output size: 1024 KB\n- Max prompts per gosling: 10\n- Auto-terminate idle goslings after: 5 minutes\n\nThese limits will help prevent token runaway by controlling how many goslings can run simultaneously and how long they can run."
    }
  ]
}
```

### `terminate_all_goslings`

Emergency killswitch that immediately terminates all running gosling processes. Use this tool when you need to stop all processes at once, especially in cases of token runaway.

**Parameters:**
- None

**Returns:**
- Confirmation message with number of terminated processes

**Example Request:**
```json
{
  "name": "terminate_all_goslings",
  "arguments": {}
}
```

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Emergency killswitch activated. Terminated 3 running gosling processes. 5 goslings were already completed or terminated.\n\nAll runaway processes have been stopped."
    }
  ]
}
```

## Tool Usage Best Practices

1. **Be Specific with Prompts**: When using `run_goose`, provide clear, specific prompts to get better results.

2. **Manage Resources**: Always use `release_gosling` when you're done with a process to free up system resources.

3. **Monitor Activity Status**: Use `get_gosling_status` to efficiently monitor all goslings and only retrieve full output when they're idle.

4. **Prevent Context Overflow**: When managing multiple goslings, use the activity sensor to minimize token usage and prevent unnecessary output fetching.

5. **Check Status Regularly**: Use `list_goslings` to monitor the status of all processes, especially for long-running tasks.

6. **Handle Errors Gracefully**: Check for error messages in the output and handle them appropriately.

7. **Use Options Judiciously**: The `options` parameter in `run_goose` can provide more control, but be aware of compatibility with different Goose CLI versions.

8. **Interactive Conversations**: Use `send_prompt_to_gosling` to have multi-turn conversations with running goslings, allowing for clarification, refinement, and follow-up questions.

9. **Paginate Large Outputs**: For goslings with large outputs, use pagination parameters in `get_gosling_output` to view specific sections without overwhelming your context.

10. **Wait for Idle Status**: For the most efficient workflow, wait for a gosling to become idle (as reported by `get_gosling_status`) before fetching its output or sending a follow-up prompt.

11. **Configure Safety Limits**: Use the `configure_circuit_breaker` tool to adjust safety limits based on your specific use case. For simple tasks, use more conservative limits; for complex workflows, increase the limits as needed.

12. **Use the Emergency Killswitch**: If you notice excessive token usage or runaway processes, use the `terminate_all_goslings` tool immediately to stop all running processes.

## See Also

- [MCP Resources Reference](./resources.md)
- [Basic Usage Guide](../usage/basic-usage.md)
- [Advanced Usage Guide](../usage/advanced-usage.md)
- [Circuit Breaker Guide](../usage/circuit-breaker.md)