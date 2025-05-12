# MCP Resources Reference

This document provides detailed reference information for all MCP resources provided by Mother Goose.

## Overview

Mother Goose provides direct access to process information and output through MCP resources. These resources can be accessed directly by MCP clients using resource URIs.

## Resource Types

### Static Resources

These resources have fixed URIs:

1. `goslings://list`: Lists all running and completed gosling processes

### Resource Templates

These resource templates allow access to specific process information:

1. `goslings://{process_id}`: Details about a specific gosling process
2. `goslings://{process_id}/output`: Current output from a specific gosling process

## Resource Details

### `goslings://list`

Lists all running and completed Goose processes.

**URI:** `goslings://list`

**MIME Type:** `application/json`

**Description:** Information about all running and completed Goose processes

**Example Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "prompt": "Explain quantum computing in simple terms",
    "status": "running",
    "startTime": "2023-06-15 14:22:45",
    "endTime": null,
    "duration": "1m 30s (running)",
    "hasOutput": true,
    "hasError": false,
    "outputPreview": "Quantum computing is a type of computing that uses quantum mechanics to process information. Unlike regular..."
  },
  {
    "id": "234f5678-f90c-23e4-b567-537825693001",
    "prompt": "Generate a poem about AI",
    "status": "completed",
    "startTime": "2023-06-15 14:10:15",
    "endTime": "2023-06-15 14:12:30",
    "duration": "2m 15s",
    "hasOutput": true,
    "hasError": false,
    "outputPreview": "Silicon Dreams\n\nIn circuits deep and code refined,\nA new form of thought comes to mind..."
  }
]
```

### `goslings://{process_id}`

Provides detailed information about a specific gosling process.

**URI Template:** `goslings://{process_id}`

**MIME Type:** `application/json`

**Description:** Details about a specific Goose process

**Parameters:**
- `process_id`: ID of the gosling process

**Example URI:** `goslings://123e4567-e89b-12d3-a456-426614174000`

**Example Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "prompt": "Explain quantum computing in simple terms",
  "options": ["-t"],
  "status": "running",
  "startTime": "2023-06-15 14:22:45",
  "endTime": null,
  "duration": "1m 30s (running)",
  "outputLength": 512,
  "errorLength": 0,
  "outputPreview": "Quantum computing is a type of computing that uses quantum mechanics to process information. Unlike regular..."
}
```

### `goslings://{process_id}/output`

Provides the full output from a specific gosling process.

**URI Template:** `goslings://{process_id}/output`

**MIME Type:** `text/plain`

**Description:** Output from a specific Goose process

**Parameters:**
- `process_id`: ID of the gosling process

**Example URI:** `goslings://123e4567-e89b-12d3-a456-426614174000/output`

**Example Response:**
```
# Gosling Process ID: 123e4567-e89b-12d3-a456-426614174000
# Status: running
# Started: 2023-06-15 14:22:45
# Duration: 1m 30s (running)
# Prompt: Explain quantum computing in simple terms

----- OUTPUT -----

Quantum computing is a type of computing that uses quantum mechanics to process information. Unlike regular computers that use bits (0s and 1s), quantum computers use quantum bits or 'qubits' which can exist in multiple states at once. This allows quantum computers to solve certain problems much faster than traditional computers.

Imagine a regular computer as having to check every path in a maze one at a time, while a quantum computer can check many paths simultaneously. This makes quantum computers potentially very powerful for specific tasks like breaking certain types of encryption, simulating molecules for drug discovery, or optimizing complex systems.

Key concepts in quantum computing include:

1. Superposition: Qubits can exist in multiple states at once
2. Entanglement: Qubits can be connected in ways that the state of one instantly affects others
3. Quantum interference: The ability to amplify correct answers and cancel incorrect ones

While quantum computers won't replace regular computers for everyday tasks, they may revolutionize fields like cryptography, materials science, and artificial intelligence by solving previously intractable problems.
```

## Resource Usage Best Practices

1. **List First**: Use `goslings://list` to get available process IDs before accessing specific resources.

2. **Check Process Details**: Use `goslings://{process_id}` to get process status and metadata before accessing output.

3. **Efficient Access**: For large outputs, it's more efficient to use the resource directly than the `get_gosling_output` tool.

4. **Cache Results**: When a process is completed, consider caching the output to avoid unnecessary resource requests.

5. **Error Handling**: Check the process status before accessing the output to handle potential errors gracefully.

## See Also

- [MCP Tools Reference](./tools.md)
- [Basic Usage Guide](../usage/basic-usage.md)
- [Advanced Usage Guide](../usage/advanced-usage.md)