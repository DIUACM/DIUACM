# GitHub Actions Deployment Setup

This document outlines the required repository secrets for the GitHub Actions deployment workflow.

## Required Repository Secrets

To set up these secrets, go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret.

### FTP Deployment Configuration
- `FTP_HOST` - FTP server hostname (usually your domain or cPanel FTP host)
- `FTP_USERNAME` - FTP username
- `FTP_PASSWORD` - FTP password

### Mail Configuration (Optional)
- Only needed if you want to configure mail settings for the application

## Workflow Features

The GitHub Actions workflow (`deploy.yml`) performs the following steps:

1. **Build Phase**
   - Sets up PHP 8.2 and Node.js 20
   - Installs Composer dependencies (production only)
   - Installs NPM dependencies
   - Builds frontend assets with Vite

2. **Test Phase**
   - Runs Laravel Pint for code style checking
   - Runs ESLint for JavaScript/TypeScript linting
   - Runs Prettier for code formatting validation
   - Runs TypeScript type checking
   - Executes Pest test suite against MySQL database

3. **Deploy Phase**
   - Cleans up development files
   - Removes testing .env file
   - Deploys to cPanel via FTP to `bdix.diuqbank.com` folder
   - Uses existing production .env file on server

## Manual Post-Deployment Steps

After the automated deployment completes, you'll need to manually run these commands via cPanel Terminal or SSH:

```bash
cd /home/yourusername/bdix.diuqbank.com
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
php artisan storage:link
php artisan filament:optimize
```

Replace `yourusername` with your actual cPanel username.

## Trigger

The workflow triggers automatically on any push to the `laravel-rewrite` branch.

## Notes

- The workflow uses MySQL 8.0 for testing
- Production deployment excludes development files and directories
- Storage permissions are set appropriately for Laravel
- The deployment target is the `bdix.diuqbank.com` folder on your cPanel FTP server
- Production .env file is managed directly on the server (not overwritten by deployment)
- Post-deployment Laravel commands need to be run manually via cPanel Terminal