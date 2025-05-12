# Advanced Usage

This guide covers advanced usage patterns and scenarios for Mother Goose.

## Recursive AI Workflows

One of the most powerful features of Mother Goose is the ability to create recursive AI workflows, where an agent can spawn multiple child processes to work on different aspects of a complex problem.

### Multi-Agent Collaboration

You can create multiple specialized agents to collaborate on a complex task:

```
I need to solve a complex machine learning problem. Use the run_goose tool to create three specialist goslings:
1. One to research the latest papers on this topic
2. One to design an experimental approach
3. One to draft code snippets for implementation

Then, I'll coordinate their efforts to produce a comprehensive solution.
```

### Divide and Conquer

For large problems, you can divide them into smaller sub-problems:

```
Use the run_goose tool to break down the problem of optimizing this large codebase into:
- Identifying performance bottlenecks
- Suggesting refactoring opportunities
- Improving algorithmic efficiency
```

Then, you can collect and synthesize the results from each gosling.

## Using Custom Options

When spawning a gosling, you can provide custom options via the `options` parameter:

```
Use the run_goose tool with prompt="Research quantum computing algorithms" and options=["-t", "--max-tokens=2000"]
```

This allows you to customize the behavior of the Goose CLI process.

## Accessing Resources Directly

In addition to the tools, Mother Goose provides direct access to resources:

### Listing All Processes

```
Access the resource at goslings://list
```

### Getting Process Details

```
Access the resource at goslings://123e4567-e89b-12d3-a456-426614174000
```

### Getting Process Output

```
Access the resource at goslings://123e4567-e89b-12d3-a456-426614174000/output
```

## Handling Long-Running Processes

For complex queries that might take some time:

1. Start the process and note the ID
2. Periodically check its status with `get_gosling_output`
3. Continue with other work while waiting
4. When complete, integrate the results

Example:
```
Use the run_goose tool to analyze this large dataset...

[Later]
Use the get_gosling_output tool to check if process XYZ has completed its analysis.
```

## Error Handling

Sometimes goslings may encounter errors. You can:

1. Check the gosling's status with `list_goslings`
2. Look for error messages in the output with `get_gosling_output`
3. Release the process with `release_gosling` if it's in an error state
4. Start a new process with modified parameters

## Performance Optimization

To get the best performance:

1. Be specific with your prompts to goslings
2. Release goslings when you're done with them
3. Avoid spawning too many concurrent goslings
4. Use meaningful prompts to make identification easier

## Next Steps

- [Troubleshooting](./troubleshooting.md)
- [MCP Tools Reference](../reference/tools.md)
- [MCP Resources Reference](../reference/resources.md)