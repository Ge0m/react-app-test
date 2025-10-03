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
    # Check if remote development branch exists before fetching
    if git ls-remote --heads origin development | grep -q development; then
        if ! output=$(git fetch origin development 2>&1); then
            echo "Warning: 'git fetch origin development' failed."
            echo "Error output:"
            echo "$output"
            echo "This may be due to network issues, authentication problems, or other git errors."
            echo "Please check your remote repository access and try again."
        elif ! output=$(git merge FETCH_HEAD 2>&1); then
            echo "Warning: 'git merge FETCH_HEAD' failed."
            echo "Error output:"
            echo "$output"
            echo "This may be due to merge conflicts or another error."
            echo "Resolve any conflicts and try merging again."
        fi
    else
        echo "Remote branch 'development' does not exist yet."
        echo "It will be pushed for the first time in the next step."
    fi
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
