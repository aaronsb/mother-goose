# Circuit Breaker

Mother Goose includes a circuit breaker system to prevent token runaway scenarios where recursive AI instances could consume excessive resources. This is particularly important for recursive AI systems where unbounded execution could lead to excessive token consumption.

## Why Use a Circuit Breaker?

Recursive AI systems like Mother Goose, which allow an AI to spawn other AI instances, can create challenges:

1. **Resource Consumption**: Without limits, an AI could spawn too many child processes
2. **Infinite Loops**: Recursive systems can potentially create feedback loops
3. **Token Runaway**: Child AIs generating excessive output can quickly consume tokens
4. **Orphaned Processes**: Sessions might be left running after their usefulness ends

The circuit breaker system addresses these issues with configurable safety limits.

## Default Configuration

Mother Goose starts with these default safety limits:

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| `enabled` | `true` | Whether the circuit breaker is active |
| `maxActiveGoslings` | `5` | Maximum number of concurrent running goslings |
| `maxTotalGoslings` | `20` | Maximum number of total goslings (including completed) |
| `maxRuntimeMinutes` | `30` | Maximum runtime for any single gosling |
| `maxOutputSizeBytes` | `1MB` | Maximum output size per gosling |
| `maxPromptsPerGosling` | `10` | Maximum interactions with any single gosling |
| `autoTerminateIdleMinutes` | `10` | Auto-terminate goslings idle for this long |

## Using the Circuit Breaker

### Configuring Safety Limits

You can configure the circuit breaker with the `configure_circuit_breaker` tool:

```
Use the configure_circuit_breaker tool to set these safety limits:
- enabled: true/false
- max_active_goslings: 5
- max_total_goslings: 20
- max_runtime_minutes: 30
- max_output_size_kb: 1024
- max_prompts_per_gosling: 10
- auto_terminate_idle_minutes: 10
```

You only need to specify the parameters you want to change. For example:

```
Use the configure_circuit_breaker tool with max_active_goslings=10 and max_runtime_minutes=60 to allow more concurrent goslings and longer runtime.
```

### Emergency Killswitch

If you need to immediately terminate all running goslings:

```
Use the terminate_all_goslings tool to immediately stop all running gosling processes.
```

## How the Circuit Breaker Works

The circuit breaker implements several protection mechanisms:

### 1. Concurrency Limiting

Before creating a new gosling, the system checks:
- If we've reached the maximum active goslings limit
- If we've reached the maximum total goslings limit

If either limit is exceeded, the request will be rejected with an error message.

### 2. Runtime Limiting

When a gosling is created, a timer is set based on `maxRuntimeMinutes`. If the gosling is still running when the timer expires, it will be automatically terminated.

### 3. Output Size Limiting

As goslings generate output, the system monitors the total output size. If it exceeds `maxOutputSizeBytes`, the gosling will be terminated to prevent excessive token consumption.

### 4. Prompt Count Limiting

The system tracks how many prompts have been sent to each gosling. Once a gosling has received `maxPromptsPerGosling` prompts, no more prompts will be accepted for that gosling.

### 5. Idle Termination

A background process checks for idle goslings every minute. If a gosling has been idle (no output) for longer than `autoTerminateIdleMinutes`, it will be automatically terminated to free up resources.

## Recommended Settings

The default settings provide a reasonable balance between flexibility and safety, but you may want to adjust them based on your specific use case:

### For Simple Projects

```
Use the configure_circuit_breaker tool with max_active_goslings=3 and max_runtime_minutes=15 to use more conservative limits for simple projects.
```

### For Complex Projects

```
Use the configure_circuit_breaker tool with max_active_goslings=10, max_total_goslings=30, and max_runtime_minutes=60 to allow more complex workflows with multiple parallel goslings.
```

### For Long-Running Sessions

```
Use the configure_circuit_breaker tool with auto_terminate_idle_minutes=30 and max_runtime_minutes=120 to allow longer runtime for complex tasks that need more time.
```

## Disabling the Circuit Breaker

While not recommended for production use, you can disable the circuit breaker entirely:

```
Use the configure_circuit_breaker tool with enabled=false to disable all safety limits.
```

**Warning**: Disabling the circuit breaker removes all protection against token runaway. Use with extreme caution and only in controlled environments.