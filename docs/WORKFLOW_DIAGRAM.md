# Development Workflow Diagram

## Branch Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                              │
│  main branch                                                    │
│  ├── Deployed to GitHub Pages                                  │
│  ├── Protected branch (requires PR)                            │
│  └── Only accepts merges from development                      │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                         Merge when stable
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        INTEGRATION                              │
│  development branch                                             │
│  ├── CI runs on every push                                     │
│  ├── Integration testing                                       │
│  └── Accepts PRs from feature branches                         │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    Merge completed features
                              │
                    ┌─────────┴─────────┐
                    │                   │
┌───────────────────┴──────┐  ┌────────┴─────────────────┐
│  feature/new-feature     │  │  feature/bug-fix         │
│  ├── Work in progress    │  │  ├── Work in progress    │
│  └── Local testing       │  │  └── Local testing       │
└──────────────────────────┘  └──────────────────────────┘
```

## Workflow Process

### 1. Starting New Work

```bash
# Always start from development
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Add new feature"

# Push to remote
git push -u origin feature/your-feature-name
```

### 2. Creating Pull Request

1. Go to GitHub repository
2. Click "Pull requests" → "New pull request"
3. Base: `development` ← Compare: `feature/your-feature-name`
4. Fill out the PR template
5. Submit for review

### 3. After PR Approval

- Feature branch is merged into `development`
- CI workflow runs automatically
- Build artifacts are created
- Feature branch can be deleted

### 4. Release to Production

When development is stable and ready for production:

```bash
# Create PR from development to main
git checkout main
git pull origin main
git merge development
git push origin main
```

- Merge triggers automatic deployment
- GitHub Pages is updated automatically
- Production site is live

## CI/CD Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│  Push to feature branch                                          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Create PR to development                                        │
│  ├── PR template filled out                                      │
│  └── Code review requested                                       │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Merge to development                                            │
│  ├── Triggers: Development Branch CI workflow                    │
│  │   ├── Install dependencies                                    │
│  │   ├── Build application                                       │
│  │   └── Upload artifacts                                        │
│  └── ✅ Build successful                                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │ When ready for release
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Create PR from development to main                              │
│  ├── Final review                                                │
│  └── Testing verification                                        │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Merge to main                                                   │
│  ├── Triggers: Deploy to GitHub Pages workflow                  │
│  │   ├── Install dependencies                                    │
│  │   ├── Build application                                       │
│  │   └── Deploy to gh-pages branch                              │
│  └── 🚀 Production deployed                                      │
└──────────────────────────────────────────────────────────────────┘
```

## File Organization

```
SZMatchBuilder/
├── .github/
│   ├── workflows/
│   │   ├── development.yml    # CI for development branch
│   │   └── deploy.yml         # Deploy to GitHub Pages
│   └── pull_request_template.md
├── docs/
│   └── SETUP_DEV_BRANCH.md    # Setup instructions
├── scripts/
│   └── setup-dev-branch.sh    # Automated setup
├── src/                        # Application source code
├── .gitignore                  # Git ignore rules
├── CONTRIBUTING.md             # Contribution guidelines
├── README.md                   # Project documentation
└── IMPLEMENTATION_SUMMARY.md   # This implementation details
```

## Quick Reference Commands

### Daily Development

```bash
# Start new feature
git checkout development && git pull
git checkout -b feature/my-feature

# Commit and push
git add . && git commit -m "message"
git push -u origin feature/my-feature

# Update from development
git checkout development && git pull
git checkout feature/my-feature
git merge development
```

### Maintainer Tasks

```bash
# Merge feature to development
git checkout development
git pull origin development
git merge feature/my-feature
git push origin development

# Release to production
git checkout main
git pull origin main
git merge development
git push origin main
```

## Benefits Summary

| Aspect | Benefit |
|--------|---------|
| **Stability** | Production branch is protected from untested changes |
| **Quality** | All code reviewed and CI-tested before merging |
| **Automation** | Automatic builds and deployment |
| **Collaboration** | Clear process for multiple developers |
| **Rollback** | Easy to revert if issues found |
| **Documentation** | Comprehensive guides for all contributors |

## Support

For questions or issues:
- See [SETUP_DEV_BRANCH.md](SETUP_DEV_BRANCH.md) for setup help
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
- Open an issue on GitHub for additional support
