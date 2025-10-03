#!/bin/bash

# Development Branch Setup Script
# This script creates the development branch from main

echo "Setting up development branch for SZ Match Builder..."

# Ensure we have the latest main branch
echo "Fetching latest changes from main..."
git fetch origin main

# Check if development branch already exists
if git show-ref --verify --quiet refs/heads/development; then
    echo "Development branch already exists locally."
    echo "Checking out development branch..."
    git checkout development
    git pull origin development 2>/dev/null || echo "Branch not yet on remote, will be pushed for first time."
else
    echo "Creating development branch from main..."
    git checkout -b development origin/main
fi

# Push development branch to remote if it doesn't exist there
if ! git ls-remote --heads origin development | grep -q development; then
    echo "Pushing development branch to remote..."
    git push -u origin development
    echo "✓ Development branch created and pushed to remote!"
else
    echo "✓ Development branch already exists on remote."
fi

echo ""
echo "Development branch setup complete!"
echo ""
echo "You can now:"
echo "  - Create feature branches from development: git checkout -b feature/your-feature"
echo "  - Test changes in development before merging to main"
echo "  - See README.md for the complete branching strategy"
