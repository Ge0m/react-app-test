# SZ Match Builder

Dragon Ball Sparking! Zero League Match Builder - A web application for creating and managing tournament matches.

## Quick Links

- 📖 [Setup Development Branch](docs/SETUP_DEV_BRANCH.md) - First-time setup for the development workflow
- 🤝 [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project
- 🚀 [GitHub Pages Deployment](https://ge0m.github.io/react-app-test/) - Live production site

## Branching Strategy

This repository uses a simple branching strategy to ensure code quality and stability:

> **📋 First-time setup?** See [docs/SETUP_DEV_BRANCH.md](docs/SETUP_DEV_BRANCH.md) for detailed instructions on creating the development branch.

### Branches

- **`main`** - Production branch. This branch contains stable, production-ready code that is deployed to GitHub Pages.
- **`development`** - Development branch. Use this branch for testing new features and updates before merging to production.

### Workflow

1. **Development**: Create feature branches from `development` and work on new features
2. **Testing**: Merge feature branches into `development` for integration testing
3. **Production**: Once features are tested and stable in `development`, merge to `main` for production deployment

### Creating a Feature Branch

```bash
# Start from development branch
git checkout development
git pull origin development

# Create your feature branch
git checkout -b feature/your-feature-name

# Work on your changes...
git add .
git commit -m "Your commit message"
git push origin feature/your-feature-name
```

### Merging to Development

```bash
# Switch to development
git checkout development
git pull origin development

# Merge your feature
git merge feature/your-feature-name

# Push to development
git push origin development
```

### Merging to Production

```bash
# Switch to main
git checkout main
git pull origin main

# Merge from development
git merge development

# Push to production
git push origin main
```

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Technologies

- React 18
- Vite
- Tailwind CSS
- js-yaml
- lucide-react