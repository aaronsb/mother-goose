#!/bin/bash
set -e

echo "Starting build process..."

# Step 1: Lint the code
echo "Running linter..."
npm run lint || { echo "❌ Linting failed"; exit 1; }

# Step 2: Run tests
echo "Running tests..."
npm test -- tests/basic.test.ts tests/index.test.ts || { echo "❌ Tests failed"; exit 1; }

# Step 3: Build the project
echo "Building the project..."
npm run build || { echo "❌ Build failed"; exit 1; }

echo "✅ Build process completed successfully!"