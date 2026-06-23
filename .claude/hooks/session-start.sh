#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install dependencies when added (extend this as the project grows)
if [ -f "$CLAUDE_PROJECT_DIR/package.json" ]; then
  echo "Installing Node.js dependencies..."
  cd "$CLAUDE_PROJECT_DIR"
  npm install
fi

if [ -f "$CLAUDE_PROJECT_DIR/requirements.txt" ]; then
  echo "Installing Python dependencies..."
  pip install -r "$CLAUDE_PROJECT_DIR/requirements.txt" --quiet
fi

if [ -f "$CLAUDE_PROJECT_DIR/pyproject.toml" ]; then
  echo "Installing Python project dependencies..."
  cd "$CLAUDE_PROJECT_DIR"
  pip install -e . --quiet
fi

echo "Session start hook completed."
