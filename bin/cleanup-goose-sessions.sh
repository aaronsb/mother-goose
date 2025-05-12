#!/bin/bash
#
# cleanup-goose-sessions.sh
# 
# This script finds and terminates all running Goose sessions.
# It's useful for cleaning up stale Goose processes that may be using system resources.

echo "🔍 Searching for active Goose sessions..."

# Find all Goose processes - exclude the cleanup script itself
SCRIPT_NAME=$(basename "$0")
GOOSE_PROCS=$(ps aux | grep -E '[g]oose run|[g]oose.*session' | grep -v "$SCRIPT_NAME" | awk '{print $2}')
GOOSE_COUNT=$(echo "$GOOSE_PROCS" | grep -v "^$" | wc -l)

if [ -z "$GOOSE_PROCS" ] || [ "$GOOSE_COUNT" -eq 0 ]; then
  echo "✅ No active Goose sessions found. Everything is clean!"
  exit 0
fi

echo "⚠️  Found $GOOSE_COUNT active Goose session(s)."
echo "🔍 Examining Goose processes:"

# Show details of found processes before terminating
for PID in $GOOSE_PROCS; do
  CMD=$(ps -p $PID -o cmd=)
  RUNTIME=$(ps -p $PID -o etime=)
  echo "  → PID $PID: $CMD (running for $RUNTIME)"
done

echo "🔄 Terminating all Goose sessions..."

# Terminate each process
for PID in $GOOSE_PROCS; do
  kill $PID
  # Check if process was successfully terminated
  if kill -0 $PID 2>/dev/null; then
    echo "  ❌ Failed to terminate process $PID, trying with SIGKILL..."
    kill -9 $PID
    sleep 0.5
    if kill -0 $PID 2>/dev/null; then
      echo "  ⚠️  Could not terminate process $PID."
    else
      echo "  ✅ Forcefully terminated process $PID."
    fi
  else
    echo "  ✅ Successfully terminated process $PID."
  fi
done

# Check if any processes are still running (excluding this script)
REMAINING=$(ps aux | grep -E '[g]oose run|[g]oose.*session' | grep -v "$SCRIPT_NAME" | wc -l)

if [ "$REMAINING" -eq 0 ]; then
  echo "✅ All Goose sessions have been terminated successfully."
else
  echo "⚠️  $REMAINING Goose session(s) could not be terminated. You may need to manually kill these processes."
fi

# Also look for any Goose session files
echo "🔍 Checking for Goose session files..."
SESSION_FILES=$(find /tmp -type f -name "goose-session-*" -o -name "gosling-*" -o -name "goose-*.sock" 2>/dev/null)

# Also look for temporary directories related to Goose
echo "🔍 Checking for Goose session directories..."
SESSION_DIRS=$(find /tmp -type d -name "goose-*" -o -name "gosling-*" 2>/dev/null)

if [ -n "$SESSION_FILES" ]; then
  echo "🗑️  Cleaning up Goose session files..."
  echo "$SESSION_FILES" | xargs rm -f
  echo "✅ Session files removed."
else
  echo "✅ No session files found."
fi

if [ -n "$SESSION_DIRS" ]; then
  echo "🗑️  Cleaning up Goose session directories..."
  echo "$SESSION_DIRS" | xargs rm -rf
  echo "✅ Session directories removed."
else
  echo "✅ No session directories found."
fi

echo "✨ Goose session cleanup complete."