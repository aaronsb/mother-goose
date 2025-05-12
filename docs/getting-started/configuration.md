# Configuration Guide

This guide explains how to configure Mother Goose with various MCP clients.

## MCP Client Configuration

Mother Goose is designed to work with any MCP-compatible client. You'll need to add Mother Goose to your MCP client's configuration.

### Configuring with Anthropic Claude

To use Mother Goose with Anthropic Claude, add it to your MCP settings configuration file:

```json
{
  "mcpServers": {
    "mother-goose": {
      "command": "npx",
      "args": ["mother-goose"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If you've installed Mother Goose globally:

```json
{
  "mcpServers": {
    "mother-goose": {
      "command": "mother-goose",
      "args": [],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If you've cloned the repository:

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

Replace `/path/to/mother-goose` with the absolute path to your Mother Goose installation.

### Configuring Environment Variables

Mother Goose doesn't require any specific environment variables, but you can pass environment variables to the Goose CLI processes if needed:

```json
{
  "mcpServers": {
    "mother-goose": {
      "command": "npx",
      "args": ["mother-goose"],
      "env": {
        "GOOSE_API_KEY": "your-api-key",
        "GOOSE_CUSTOM_PARAM": "custom-value"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Automate Approval (Optional)

If you frequently use certain tools and want to automate their approval, you can add them to the `autoApprove` array:

```json
{
  "mcpServers": {
    "mother-goose": {
      "command": "npx",
      "args": ["mother-goose"],
      "env": {},
      "disabled": false,
      "autoApprove": ["list_goslings", "get_gosling_output"]
    }
  }
}
```

## Command Line Options

Mother Goose supports several command line options:

- `--help` or `-h`: Display help information
- `--version` or `-v`: Show version information
- `validate`: Run the validation script to check prerequisites

Example:

```bash
npx mother-goose --help
```

## Next Steps

- [Quick Start Guide](./quick-start.md)
- [Basic Usage](../usage/basic-usage.md)
- [Advanced Usage](../usage/advanced-usage.md)