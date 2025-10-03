# Contributing to SZ Match Builder

Thank you for your interest in contributing to SZ Match Builder! This document provides guidelines for contributing to the project.

## Development Workflow

We use a branching strategy to maintain code quality and stability:

### Branch Structure

- **`main`** - Production branch (protected)
  - Contains stable, production-ready code
  - Automatically deploys to GitHub Pages on push
  - Only accepts merges from `development` branch

- **`development`** - Development branch
  - Integration branch for new features
  - Used for testing before production release
  - Runs CI checks on every push

- **`feature/*`** - Feature branches
  - Created from `development` for new features
  - Merged back into `development` when complete

### Getting Started

1. Fork the repository (optional for external contributors)
2. Clone your fork or the main repository:
   ```bash
   git clone https://github.com/Ge0m/SZMatchBuilder.git
   cd SZMatchBuilder
   ```

3. Checkout the development branch:
   ```bash
   git checkout development
   git pull origin development
   ```

4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Making Changes

1. Make your changes in your feature branch
2. Test your changes locally:
   ```bash
   npm install
   npm run dev
   ```

3. Build the project to ensure it compiles:
   ```bash
   npm run build
   ```

4. Commit your changes with clear, descriptive messages:
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   ```

### Submitting Changes

1. Push your feature branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request:
   - Target branch: `development`
   - Provide a clear description of your changes
   - Reference any related issues

3. Wait for review and address any feedback

### Merging to Production

Once changes in `development` are tested and stable:

1. Create a Pull Request from `development` to `main`
2. After approval and merge, changes will automatically deploy to GitHub Pages

## Code Style

- Follow existing code style and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components focused and reusable

## Testing

- Test your changes thoroughly before submitting
- Ensure the build process completes successfully
- Verify the application works in development mode

## Questions?

If you have questions or need help, please open an issue in the repository.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
