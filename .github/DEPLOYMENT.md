# GitHub Actions Deployment Setup

This repository uses GitHub Actions for automatic deployment to both production and development environments using GitHub Environments.

## Workflows

- **Production Deployment**: Triggers on pushes to the `main` branch (uses `production` environment)
- **Development Deployment**: Triggers on pushes to the `dev` branch (uses `development` environment)

## Required GitHub Secrets

You need to configure secrets in GitHub Environments. This allows you to use the same secret names for both environments with different values.

### Repository-level Secrets
- `DEPLOY_PRIVATE_KEY`: Your SSH private key for server access (shared across environments)

### Environment-specific Secrets

For both `production` and `development` environments, configure these secrets:

- `DEPLOY_HOSTNAME`: Server hostname (e.g., `deploy.diuacm.com` for production, `dev.diuacm.com` for development)
- `DEPLOY_REMOTE_USER`: SSH username for the server
- `DEPLOY_PATH`: Deploy path on the server (e.g., `/home/user/domain.com`)
- `DEPLOY_HTTP_USER`: HTTP user for the server

## How to Configure GitHub Environments and Secrets

### 1. Create GitHub Environments
1. Go to your GitHub repository
2. Navigate to **Settings** → **Environments**
3. Click **New environment**
4. Create two environments:
   - `production`
   - `development`

### 2. Configure Environment Secrets
1. Click on each environment (`production` or `development`)
2. In the **Environment secrets** section, click **Add secret**
3. Add the following secrets for each environment:
   - `DEPLOY_HOSTNAME`
   - `DEPLOY_REMOTE_USER`
   - `DEPLOY_PATH`
   - `DEPLOY_HTTP_USER`

### 3. Configure Repository Secret
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add `DEPLOY_PRIVATE_KEY` with your SSH private key content

## Example Configuration

### Production Environment Secrets:
- `DEPLOY_HOSTNAME`: `deploy.diuacm.com`
- `DEPLOY_REMOTE_USER`: `diuacmc1`
- `DEPLOY_PATH`: `/home/diuacmc1/deploy.diuacm.com`
- `DEPLOY_HTTP_USER`: `diuacmc1`

### Development Environment Secrets:
- `DEPLOY_HOSTNAME`: `dev.diuacm.com`
- `DEPLOY_REMOTE_USER`: `devuser`
- `DEPLOY_PATH`: `/home/devuser/dev.diuacm.com`
- `DEPLOY_HTTP_USER`: `devuser`

## SSH Key Setup

1. Generate an SSH key pair if you don't have one:
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   ```

2. Add the public key to your server's `~/.ssh/authorized_keys`

3. Copy the private key content and add it as the `DEPLOY_PRIVATE_KEY` secret in GitHub

## Environment Configuration

The workflows use environment variables from GitHub secrets. Make sure your `deploy.php` file is configured to read these environment variables (which it already is).

## Workflow Features

- **Caching**: Composer and npm dependencies are cached for faster builds
- **Concurrency Control**: Prevents concurrent deployments to the same environment
- **Asset Building**: Builds frontend assets before deployment
- **Environment Separation**: Different configurations for production and development
- **Optimized Dependencies**: Production uses `--no-dev` flag for smaller deployments

## Manual Deployment

You can still deploy manually using:
```bash
dep deploy
```

This will use your local environment variables from the `.env` file.