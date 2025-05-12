# Troubleshooting

This guide helps you diagnose and fix common issues with Mother Goose.

## Validation Errors

### Goose CLI Not Found

**Problem:** The validation script reports that Goose CLI is not installed.

**Solution:**
1. Check if Goose is installed: `goose --version`
2. If not installed, visit [https://block.xyz/docs/goose](https://block.xyz/docs/goose) and follow installation instructions
3. Make sure the `goose` command is in your PATH
4. Restart your terminal or command prompt

### Goose CLI Version Compatibility

**Problem:** Mother Goose reports errors related to Goose CLI parameters.

**Solution:**
1. Check your Goose CLI version: `goose --version`
2. Try running Goose directly to see if it works: `goose run --text "Hello"`
3. If your version of Goose uses different parameters, you may need to update Goose or modify the Mother Goose source code

## Connection Issues

### MCP Client Can't Connect

**Problem:** Your MCP client (like Claude) can't connect to Mother Goose.

**Solution:**
1. Make sure Mother Goose is running in a separate terminal
2. Check your MCP client configuration
3. Verify the path to Mother Goose is correct in your configuration
4. Try using npx if you're using a local installation: `"command": "npx", "args": ["mother-goose"]`

### Connection Timeout

**Problem:** Connection to Mother Goose times out.

**Solution:**
1. Check if Mother Goose is still running
2. Check for any error messages in the terminal where Mother Goose is running
3. Restart Mother Goose
4. Check your network configuration if you're running Mother Goose on a different machine

## Process Management Issues

### Gosling Process Not Starting

**Problem:** The `run_goose` tool doesn't start a new process.

**Solution:**
1. Check if Goose CLI works directly: `goose run --text "Hello"`
2. Look for error messages in the Mother Goose console
3. Verify your API key configuration for Goose
4. Try simplifying your prompt

### Process Stuck or Unresponsive

**Problem:** A gosling process seems stuck and doesn't complete.

**Solution:**
1. Use `release_gosling` to stop the unresponsive process
2. Check the process output for any error messages
3. Try breaking your task into smaller sub-tasks
4. Restart Mother Goose if multiple processes are unresponsive

## Output Issues

### No Output from Gosling

**Problem:** `get_gosling_output` returns no output.

**Solution:**
1. Check if the process is still running with `list_goslings`
2. Be patient, as some queries take time to process
3. Check if the process encountered an error
4. Try a simpler prompt to test if Goose is working correctly

### Error Messages in Output

**Problem:** Gosling output contains error messages.

**Solution:**
1. Check the specific error message for clues
2. Verify your Goose API key and configuration
3. Check your network connection
4. Try a different prompt to isolate if the error is specific to your query

## Advanced Troubleshooting

### Debug Logging

To get more information about what's happening:

1. Run Mother Goose with debug logging:
   ```bash
   DEBUG=* npx mother-goose
   ```

2. Look for specific error messages or patterns

### Testing with the MCP Inspector

You can test Mother Goose with the MCP Inspector tool:

```bash
npm run inspector
```

This allows you to test the MCP server directly without a full client.

### Checking Goose CLI Directly

If you suspect issues with Goose CLI:

```bash
# Test basic functionality
goose run --text "Hello, world"

# Check version
goose --version

# Check help
goose --help
```

## Getting Help

If you continue to experience issues:

1. Check the [GitHub repository](https://github.com/aaronsb/mother-goose) for known issues
2. Open a new issue with details about your problem
3. Include relevant error messages and your environment details (OS, Node.js version, Goose version)