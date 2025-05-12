# Installation Guide

This guide explains how to install Mother Goose and its prerequisites.

## Prerequisites

Before installing Mother Goose, you need to have the following installed:

1. **Node.js v16 or higher**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify with: `node --version`

2. **Block Goose CLI**
   - Follow the installation instructions at [block.xyz/docs/goose](https://block.xyz/docs/goose)
   - Verify with: `goose --version`

## Installation Methods

There are three ways to install and use Mother Goose:

### Method 1: Use with npx (Recommended)

The easiest way to use Mother Goose is with npx, which comes with npm (Node Package Manager):

```bash
# Run validation to check prerequisites
npx mother-goose validate

# Run the MCP server
npx mother-goose
```

This method doesn't require a permanent installation and always uses the latest version.

### Method 2: Global Installation

If you prefer to install Mother Goose globally:

```bash
# Install globally
npm install -g mother-goose

# Verify installation
mother-goose --version

# Run validation
mother-goose validate

# Start the server
mother-goose
```

### Method 3: Local Development

For contributing to Mother Goose or customizing it:

```bash
# Clone the repository
git clone https://github.com/aaronsb/mother-goose.git
cd mother-goose

# Install dependencies
npm install

# Run validation
npm run validate

# Build the project
npm run build

# Run the server
node build/index.js
```

## Verification

After installation, verify that Mother Goose works correctly:

1. Run the validation script:
   ```bash
   mother-goose validate
   # or
   npx mother-goose validate
   ```

2. Start the server and look for the success message:
   ```
   ✅ Mother Goose MCP server running on stdio
   Ready to receive MCP requests
   ```

## Next Steps

- [Configure Mother Goose](./configuration.md)
- [Quick Start Guide](./quick-start.md)
- [Basic Usage](../usage/basic-usage.md)