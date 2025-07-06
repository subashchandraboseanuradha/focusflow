# FocusFlow Extension Deployment Guide

## Repository Structure Recommendation

### Separate Repositories
1. **focusflow-web** (Current repo) - Next.js web application
2. **focusflow-extension** (New repo) - Browser extension

## Environment Configuration

### Extension Configuration for Different Environments

#### Development
```javascript
// config/development.js
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000',
  WEB_APP_URL: 'http://localhost:3000',
  ENVIRONMENT: 'development'
};
```

#### Staging
```javascript
// config/staging.js
const CONFIG = {
  API_BASE_URL: 'https://staging.focusflow.app',
  WEB_APP_URL: 'https://staging.focusflow.app',
  ENVIRONMENT: 'staging'
};
```

#### Production
```javascript
// config/production.js
const CONFIG = {
  API_BASE_URL: 'https://focusflow.app',
  WEB_APP_URL: 'https://focusflow.app',
  ENVIRONMENT: 'production'
};
```

## Migration Steps

### 1. Create New Extension Repository
```bash
# Create new repository
mkdir focusflow-extension
cd focusflow-extension
git init

# Copy extension files
cp -r /path/to/focusflow/extension/* .

# Create proper structure
mkdir src config docs
mv *.js *.html *.json src/
```

### 2. Update Extension for Multiple Environments
Create environment-specific builds with different API endpoints.

### 3. Chrome Web Store Publishing
- Separate repo makes it easier to submit to Chrome Web Store
- Can have different versions for different environments
- Cleaner release process

## API Compatibility Strategy

### Version Pinning
- Extension specifies compatible API version
- Web app maintains backward compatibility
- Graceful degradation for version mismatches

### Configuration Management
- Extension fetches configuration from web app
- Dynamic API endpoint configuration
- Environment detection

## Deployment Workflows

### Web App Deployment
- Deploy to Vercel/Netlify/AWS
- Multiple environments (dev, staging, prod)
- API endpoints available at different URLs

### Extension Deployment
- Build for different environments
- Submit to Chrome Web Store
- Auto-update mechanism
