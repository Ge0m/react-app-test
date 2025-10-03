# SZMatchBuilder

DBZ Sparking Zero Match Builder

## Development

This repository uses a `Development` branch for ongoing development work. The `main` branch contains stable releases.

## Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the `main` or `Development` branches.

### Automatic Deployment

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
1. Install dependencies
2. Build the application using Vite
3. Deploy the `dist` folder to GitHub Pages

### Manual Deployment

You can also trigger a deployment manually:
1. Go to the Actions tab in the GitHub repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow" and select the branch to deploy

### Local Build

To build the application locally:
```bash
npm install
npm run build
```

The built files will be in the `dist` directory.

### GitHub Pages Configuration

The application is configured to be served from the `/SZMatchBuilder/` base path (see `vite.config.js`).