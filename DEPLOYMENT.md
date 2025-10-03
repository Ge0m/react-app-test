# GitHub Pages Deployment Setup

## Overview

This document explains the GitHub Pages deployment configuration for the SZMatchBuilder application.

## Configuration Files

### 1. `.github/workflows/deploy.yml`
The GitHub Actions workflow that automates the build and deployment process.

**Triggers:**
- Push to `main` branch
- Push to `Development` branch  
- Manual trigger via `workflow_dispatch`

**Permissions:**
- `contents: read` - Read repository contents
- `pages: write` - Write to GitHub Pages
- `id-token: write` - Required for GitHub Pages deployment

**Jobs:**
1. **build** - Builds the application
   - Checks out the code
   - Sets up Node.js 18
   - Installs dependencies with `npm ci`
   - Builds the app with `npm run build`
   - Uploads the `dist` folder as a Pages artifact

2. **deploy** - Deploys to GitHub Pages
   - Depends on the build job
   - Deploys the artifact to GitHub Pages
   - Sets the deployment URL in the environment

### 2. `vite.config.js`
Configures the base path for the application.

```javascript
base: '/SZMatchBuilder/'
```

This ensures all assets are loaded correctly when the app is served from the `/SZMatchBuilder/` subdirectory on GitHub Pages.

### 3. `package.json`
Contains the build scripts and dependencies.

**Key Scripts:**
- `build` - Builds the application using Vite
- `predeploy` - Runs before deploy (calls build)
- `deploy` - Deploys to gh-pages (for manual deployment)

**Key Dependencies:**
- `gh-pages` - For manual deployment (optional, as we use GitHub Actions)
- `vite` - Build tool
- React and related dependencies

## GitHub Repository Settings

To complete the deployment setup, ensure the following settings are configured in the GitHub repository:

1. Go to **Settings** > **Pages**
2. Under **Source**, select **GitHub Actions**
3. The site will be published to: `https://ge0m.github.io/SZMatchBuilder/`

## Deployment Process

### Automatic Deployment
1. Push changes to `main` or `Development` branch
2. GitHub Actions workflow automatically triggers
3. Application is built
4. Built files are deployed to GitHub Pages
5. Site is updated at `https://ge0m.github.io/SZMatchBuilder/`

### Manual Deployment via GitHub UI
1. Go to the **Actions** tab in the repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select the branch to deploy from
5. Click **Run workflow** button

### Local Testing
To test the build locally:

```bash
npm install
npm run build
npm run preview
```

The preview server will show how the app will look when deployed.

## Troubleshooting

### Common Issues

**Issue: Assets not loading (404 errors)**
- Verify `base: '/SZMatchBuilder/'` is set in `vite.config.js`
- Check that the repository name matches the base path

**Issue: Workflow fails on build**
- Check Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Review build logs in Actions tab

**Issue: Pages not updating**
- Check if workflow completed successfully
- Verify GitHub Pages is set to use GitHub Actions
- Clear browser cache

## Files Modified/Created

1. `.github/workflows/deploy.yml` - Created
2. `README.md` - Updated with deployment documentation

## Repository URLs

- **Repository**: https://github.com/Ge0m/SZMatchBuilder
- **GitHub Pages**: https://ge0m.github.io/SZMatchBuilder/
- **Workflow Runs**: https://github.com/Ge0m/SZMatchBuilder/actions
