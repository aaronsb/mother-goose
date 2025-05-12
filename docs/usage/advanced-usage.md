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
2. Periodically check its status with `get_gosling_status`
3. Continue with other work while waiting
4. When the status shows IDLE, retrieve the complete output
5. Integrate the results

Example:
```
# Start a complex analysis
Use the run_goose tool to analyze this large dataset...

# Later, check if it's done without retrieving the entire output
Use the get_gosling_status tool to check if process XYZ is idle yet.

# Once it shows IDLE status, retrieve the complete output
Use the get_gosling_output tool with process_id="XYZ" to see the analysis results.
```

### Activity Sensing

Mother Goose includes an activity sensing system that detects when goslings are actively generating output versus when they're idle and ready for interaction:

1. **Working Status**: A gosling is considered to be in WORKING status when it's actively generating output.
2. **Idle Status**: A gosling is considered IDLE after it has generated no new output for a threshold period (default: 2000ms).
3. **Hysteresis**: A time buffer prevents false idle detections due to temporary pauses in output generation.

This helps prevent context overwhelm by allowing you to monitor multiple goslings efficiently without needing to fetch their complete outputs until they're ready for interaction.

Example of using activity sensing to manage multiple goslings:

```
# Start multiple goslings for different aspects of a task
Use the run_goose tool to create three specialist goslings for different parts of a complex project.

# Monitor activity status with minimal context consumption
Use the get_gosling_status tool to get a compact activity report.

# For any gosling marked as IDLE:
Use the get_gosling_output tool to retrieve its complete output.
Use the send_prompt_to_gosling tool to continue the conversation if needed.

# For goslings still marked as WORKING:
Wait until a later status check shows them as IDLE.
```

## Interactive Conversations with Goslings

Mother Goose now supports multi-turn conversations with goslings, allowing for interactive workflows:

### Sending Follow-Up Prompts

After starting a gosling, you can send additional prompts to it:

```
# Step 1: Start a gosling
Use the run_goose tool with prompt="What are the fundamental principles of machine learning?"

# Step 2: Wait for initial response
Use the get_gosling_output tool with process_id="..." to see the initial response

# Step 3: Send a follow-up question
Use the send_prompt_to_gosling tool with process_id="..." and prompt="Can you elaborate on neural networks?"

# Step 4: Get updated response
Use the get_gosling_output tool again to see the combined conversation
```

### Session Persistence

Gosling sessions are automatically managed with the following features:

1. All goslings run in interactive mode with named sessions
2. If a gosling has exited, it can be automatically resumed when sending a follow-up prompt
3. Full prompt history is maintained and displayed in the output

### Paginated Output Viewing

For goslings generating large amounts of output, you can use pagination:

```
# View first 100 lines (default)
Use the get_gosling_output tool with process_id="..."

# View specific section (lines 200-300)
Use the get_gosling_output tool with process_id="...", offset=200, limit=100

# View entire output
Use the get_gosling_output tool with process_id="...", full_output=true
```

## Error Handling

Sometimes goslings may encounter errors. You can:

1. Check the gosling's status with `list_goslings`
2. Look for error messages in the output with `get_gosling_output`
3. Release the process with `release_gosling` if it's in an error state
4. Start a new process with modified parameters

## Performance Optimization

To get the best performance:

1. **Use Activity Sensing**: Use `get_gosling_status` to monitor goslings efficiently instead of repeatedly fetching complete outputs.
2. **Wait for Idle State**: Only retrieve complete outputs or send follow-up prompts when a gosling is in the IDLE state.
3. **Adjust Idle Threshold**: Customize the `idle_threshold_ms` parameter based on your specific needs (higher for more confirmation, lower for faster response).
4. **Be Specific with Prompts**: Provide clear, specific prompts to goslings for better results.
5. **Release When Done**: Always use `release_gosling` when you're done with a process to free up system resources.
6. **Limit Concurrent Processes**: Avoid spawning too many concurrent goslings to prevent resource contention.
7. **Use Meaningful Prompts**: Include descriptive task information to make identification easier in status reports.
8. **Paginate Large Outputs**: For large outputs, use pagination to view only the sections you need rather than the full content.

## Shared Memory with Memory Graph

One of the most powerful advanced usage patterns is combining Mother Goose with a shared memory endpoint like [Memory Graph](https://github.com/aaronsb/memory-graph), which enables sophisticated collaboration between goslings.

### Shared Memory Architecture

When Goose is configured with a shared memory endpoint, all goslings (including the parent agent and child goslings) have access to the same memory domains and can:

1. Read from shared memory
2. Write to shared memory
3. Follow connections between memories
4. Traverse memory domains

This creates a powerful collaborative environment where knowledge can be shared and accumulated across all agents.

### Directed Graph Memory Workflows

Using Memory Graph's domain-based organization, you can create sophisticated workflows:

```
Use the run_goose tool to create a research gosling that writes its findings to the "research" memory domain.

Use the run_goose tool to create an analysis gosling that reads from the "research" domain and writes its analysis to the "analysis" domain.

Use the run_goose tool to create a coding gosling that implements solutions based on the "analysis" domain and stores code samples in the "implementation" domain.
```

### Ontological Coordination

The supervisor agent (running Mother Goose) can coordinate the work by:

1. Setting up the memory structure and domains
2. Assigning specific tasks to each gosling
3. Monitoring memory changes
4. Synthesizing results from across domains

Each gosling can:

1. Follow semantic connections between memories
2. Add new relationships between concepts
3. Store partial results that other goslings can access
4. Create new memory domains when exploring new areas

### Example Workflow

```
# Step 1: Set up memory domains
Create memory domains for "requirements", "design", "implementation", and "testing"

# Step 2: Store initial requirements
Store key requirements in the "requirements" domain

# Step 3: Spawn design gosling
Use the run_goose tool to create a design gosling that reads requirements and creates design documents in the "design" domain

# Step 4: Spawn implementation goslings in parallel
Use the run_goose tool to create multiple implementation goslings that each work on different components based on the design domain

# Step 5: Spawn testing gosling
Use the run_goose tool to create a testing gosling that verifies the implementation against requirements
```

This approach allows for complex, coordinated workflows where each gosling has a specialized role but can share knowledge and build upon the work of others.

## Next Steps

- [Troubleshooting](./troubleshooting.md)
- [MCP Tools Reference](../reference/tools.md)
- [MCP Resources Reference](../reference/resources.md)
- [Memory Graph Repository](https://github.com/aaronsb/memory-graph)