# Development Branch Setup Instructions

This document provides instructions for setting up the development branch workflow for the SZ Match Builder project.

## Automated Setup (Recommended)

Run the provided setup script:

```bash
chmod +x scripts/setup-dev-branch.sh
./scripts/setup-dev-branch.sh
```

## Manual Setup

If you prefer to set up the development branch manually, follow these steps:

### Step 1: Create the Development Branch

```bash
# Ensure you have the latest changes
git fetch origin

# Create development branch from main
git checkout -b development origin/main

# Push the development branch to remote
git push -u origin development
```

### Step 2: Verify Branch Protection (Repository Owner Only)

To protect your production branch, configure branch protection rules on GitHub:

1. Go to: Repository Settings → Branches → Branch protection rules
2. Add rule for `main` branch with these settings:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators (optional but recommended)

3. Add rule for `development` branch (optional):
   - ✅ Require status checks to pass before merging

### Step 3: Set Development as Default Branch (Optional)

For easier workflow, you can set `development` as the default branch:

1. Go to: Repository Settings → General → Default branch
2. Click the switch icon and select `development`
3. Click Update and confirm

This makes new PRs target `development` by default.

## Workflow Summary

Once setup is complete, follow this workflow:

1. **New Features**: Create feature branches from `development`
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/my-new-feature
   ```

2. **Development Testing**: Merge features into `development`
   ```bash
   git checkout development
   git merge feature/my-new-feature
   git push origin development
   ```

3. **Production Release**: Merge `development` into `main`
   ```bash
   git checkout main
   git pull origin main
   git merge development
   git push origin main
   ```

## CI/CD Workflows

The following GitHub Actions workflows are configured:

- **Development Branch CI** (`.github/workflows/development.yml`)
  - Runs on push/PR to `development`
  - Builds the application
  - Uploads build artifacts
  
- **Deploy to GitHub Pages** (`.github/workflows/deploy.yml`)
  - Runs on push to `main`
  - Builds and deploys to GitHub Pages

## Troubleshooting

### Development branch doesn't exist

If the development branch doesn't exist yet, run:
```bash
git checkout -b development origin/main
git push -u origin development
```

### Permission denied when pushing

Ensure you have write access to the repository. If you're a contributor, ask the repository owner to grant you push access.

### Merge conflicts

When merging, if you encounter conflicts:
```bash
git merge development
# Resolve conflicts in your editor
git add .
git commit
git push
```

## Additional Resources

- See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
- See [README.md](../README.md) for general project information
