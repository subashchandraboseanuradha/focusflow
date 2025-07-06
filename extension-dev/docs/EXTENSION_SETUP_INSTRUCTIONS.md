# FocusFlow Extension - Complete Setup Instructions

## 📁 Project Structure
Your standalone extension should have this structure:
```
focusflow-extension/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── config.js
├── package.json
├── .env
├── .env.example
├── .gitignore
├── README.md
├── build.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🚀 Step-by-Step Setup

### 1. Create the Extension Directory
```bash
mkdir focusflow-extension
cd focusflow-extension
```

### 2. Initialize Git Repository
```bash
git init
```

### 3. Create Essential Files

#### A. Configuration Files (Extensions don't use .env files)

**Important:** Browser extensions cannot access `.env` files directly. Instead, we use a build-time configuration system.

**Authentication Modes**

There are two primary authentication flows for the extension:

### Current Flow (Using Supabase Keys - Legacy/Optional)
This flow involves the extension directly interacting with Supabase.
1.  **User logs in** through the FocusFlow web app.
2.  **Web app stores** the Supabase access token and Supabase keys (URL, Anon Key) in extension storage.
3.  **Extension uses** this token and keys to authenticate directly with Supabase for data operations.
4.  **Your APIs verify** the token using the Supabase service role key (if API calls are made).

### Alternative Flow (API-Only, No Direct Supabase - Recommended)
This is the preferred and more secure flow, where the extension never directly accesses Supabase.
1.  **User logs in** through the FocusFlow web app.
2.  **Web app stores** *only* the Supabase access token in extension storage.
3.  **Extension only calls** your Next.js APIs with the token for all data operations.
4.  **Your APIs handle** all Supabase interactions, validating the token server-side.
5.  **Extension never needs** Supabase keys directly.

**Recommendation:** The API-Only flow is highly recommended for enhanced security and maintainability.

Create `config.template.js` file:
```javascript
// Configuration template for API-Only extension
const FOCUSFLOW_CONFIG = {
  ENVIRONMENT: '{{ENVIRONMENT}}',
  API_BASE_URL: '{{API_BASE_URL}}',
  WEB_APP_LOGIN_URL: '{{WEB_APP_LOGIN_URL}}', // Added for login redirection
  DEBUG: {{DEBUG}},
  
  // API-Only mode - no Supabase access
  AUTH_MODE: 'api-only',
  
  getApiUrl(endpoint) {
    return this.API_BASE_URL + endpoint;
  },
  
  // All extension endpoints
  ENDPOINTS: {
    CONFIG: '/api/extension/config',
    TASKS: '/api/extension/tasks',
    MONITOR: '/api/extension/monitor',
    HEALTH: '/api/extension/health'
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.FOCUSFLOW_CONFIG = FOCUSFLOW_CONFIG;
}
```

Create `build-config.json` file:
```json
{
  "development": {
    "API_BASE_URL": "http://localhost:3000",
    "DEBUG": true,
    "EXTENSION_ID": "focusflow-dev"
  },
  "staging": {
    "API_BASE_URL": "https://staging.focusflow.app",
    "DEBUG": false,
    "EXTENSION_ID": "focusflow-staging"
  },
  "production": {
    "API_BASE_URL": "https://focusflow.app",
    "DEBUG": false,
    "EXTENSION_ID": "focusflow-extension"
  }
}
```

#### B. Package.json
```json
{
  "name": "focusflow-extension",
  "version": "2.0.0",
  "description": "FocusFlow Browser Extension for productivity monitoring",
  "main": "background.js",
  "scripts": {
    "build": "node build.js",
    "build:dev": "node build.js development",
    "build:prod": "node build.js production",
    "package": "npm run build:prod && zip -r focusflow-extension.zip . -x node_modules/\\* .git/\\* .env build.js",
    "lint": "echo 'Linting extension files...'",
    "clean": "rm -f focusflow-extension.zip"
  },
  "keywords": ["productivity", "focus", "browser-extension"],
  "author": "FocusFlow Team",
  "license": "MIT",
  "devDependencies": {
    "dotenv": "^16.0.0"
  }
}
```

#### C. Build Script (build.js) - Updated for Extensions
```javascript
const fs = require('fs');
const path = require('path');

// Get environment from command line
const environment = process.argv[2] || 'development';

console.log(`Building extension for ${environment} environment...`);

// Load build configuration
let buildConfig;
try {
  buildConfig = JSON.parse(fs.readFileSync('build-config.json', 'utf8'));
} catch (error) {
  console.error('Error loading build-config.json:', error.message);
  process.exit(1);
}

const envConfig = buildConfig[environment];
if (!envConfig) {
  console.error(`Unknown environment: ${environment}`);
  console.log('Available environments:', Object.keys(buildConfig).join(', '));
  process.exit(1);
}

// Read config template
let configTemplate;
try {
  configTemplate = fs.readFileSync('config.template.js', 'utf8');
} catch (error) {
  console.error('Error loading config.template.js:', error.message);
  process.exit(1);
}

// Replace placeholders with actual values
const configContent = configTemplate
  .replace(/\{\{ENVIRONMENT\}\}/g, environment)
  .replace(/\{\{API_BASE_URL\}\}/g, envConfig.API_BASE_URL)
  .replace(/\{\{DEBUG\}\}/g, envConfig.DEBUG);

// Write the generated config.js
fs.writeFileSync('config.js', configContent);

// Update manifest.json with environment-specific values
const manifestPath = 'manifest.json';
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Update version from package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  manifest.version = packageJson.version;
  
  // Update extension name for non-production environments
  if (environment !== 'production') {
    manifest.name = `FocusFlow Extension (${environment})`;
  }
  
  // Write updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

console.log(`✅ Build completed for ${environment}!`);
console.log(`🌐 API Base URL: ${envConfig.API_BASE_URL}`);
console.log(`🐛 Debug Mode: ${envConfig.DEBUG}`);
console.log(`📝 Config written to: config.js`);
```

#### D. .gitignore (Updated for Extensions)
```gitignore
# Build-generated files (don't commit these)
config.js

# Dependencies
node_modules/

# Build outputs
dist/
build/
*.zip

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Chrome extension specific
*.crx
*.pem

# Note: Extensions don't use .env files
# Configuration is handled through build-config.json
```

#### E. README.md
```markdown
# FocusFlow Browser Extension

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Build for development:**
   ```bash
   npm run build:dev
   ```

4. **Load in Chrome:**
   - Go to chrome://extensions/
   - Enable Developer mode
   - Click "Load unpacked"
   - Select this folder

## Available Commands

- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production
- `npm run package` - Create zip for Chrome Web Store
- `npm run clean` - Remove build files

## Environment Variables

Set these in your `.env` file:
- `FOCUSFLOW_API_URL` - Your FocusFlow API URL
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Publishing to Chrome Web Store

1. Run `npm run package`
2. Upload `focusflow-extension.zip` to Chrome Web Store
3. Fill out store listing details
4. Submit for review
```

### 4. Copy Your Existing Extension Files

Copy these files from your current extension folder:
- `manifest.json`
- `background.js` 
- `content.js`
- `popup.html`
- `popup.js`
- Any icon files to `icons/` folder

### 5. Update Files for Standalone Setup

#### A. Update background.js for API-Only Mode
Replace all hardcoded URLs and remove Supabase dependencies:

```javascript
// ❌ Remove all Supabase imports and initialization
// Don't import Supabase client

// ✅ Use only API calls
async function fetchExtensionConfig(token) {
  try {
    const response = await fetch(FOCUSFLOW_CONFIG.getApiUrl(FOCUSFLOW_CONFIG.ENDPOINTS.CONFIG), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const config = await response.json();
    
    // Store only the access token and user info
    accessToken = token;
    userId = config.userId;
    
    return config;
  } catch (error) {
    console.error('Error fetching extension config:', error);
    return null;
  }
}

// ✅ All data operations through API
async function logActivity(activityData) {
  if (!accessToken) return;
  
  try {
    const response = await fetch(FOCUSFLOW_CONFIG.getApiUrl(FOCUSFLOW_CONFIG.ENDPOINTS.MONITOR), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activityData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
```

#### B. Update popup.js for API-Only Mode  
```javascript
// ✅ Use configuration for all URLs
const loginUrl = FOCUSFLOW_CONFIG.API_BASE_URL + '/auth/login';

// ✅ All API calls through configuration
async function loadActiveTasks() {
  chrome.runtime.sendMessage({ 
    type: 'GET_ACTIVE_TASKS'
  }, (response) => {
    if (response && response.tasks) {
      console.log('Active tasks:', response.tasks);
    }
  });
}
```

### 6. Install Dependencies
```bash
npm install
```

### 7. Build and Test
```bash
# Build for development
npm run build:dev

# Test in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select your extension folder
```

## 🔐 API-Only Authentication Flow

### How It Works:

1. **🌐 User Login**: User logs into FocusFlow web app
2. **💾 Token Storage**: Web app stores access token in extension's local storage
3. **🔄 Extension Requests**: Extension makes requests only to your API endpoints
4. **🛡️ API Validation**: Your APIs validate tokens and handle all Supabase operations
5. **📊 Data Flow**: All data flows: Extension ↔ Your API ↔ Supabase

### Implementation Steps:

#### Step 1: Web App Integration
Add this to your web app to store tokens for the extension:

```javascript
// In your web app after successful login
if (user && session) {
  // Store token for extension
  chrome.storage?.local.set({
    'supabaseAccessToken': session.access_token,
    'userId': user.id
  });
}
```

#### Step 2: Extension API Calls
All extension operations go through your API:

```javascript
// ✅ Get configuration from your API
async function getConfig() {
  const response = await fetch(FOCUSFLOW_CONFIG.getApiUrl('/api/extension/config'), {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  return response.json();
}

// ✅ Get tasks from your API  
async function getTasks() {
  const response = await fetch(FOCUSFLOW_CONFIG.getApiUrl('/api/extension/tasks'), {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  return response.json();
}

// ✅ Log activity through your API
async function logActivity(data) {
  const response = await fetch(FOCUSFLOW_CONFIG.getApiUrl('/api/extension/monitor'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

#### Step 3: Your API Handles Everything
Your APIs authenticate and interact with Supabase:

```javascript
// Your /api/extension/config endpoint
export async function GET(request) {
  const token = getTokenFromRequest(request);
  const { data: user } = await supabase.auth.getUser(token);
  
  return NextResponse.json({
    userId: user.id,
    userEmail: user.email,
    // No Supabase keys returned to extension
  });
}

// Your /api/extension/tasks endpoint  
export async function GET(request) {
  const token = getTokenFromRequest(request);
  const { data: user } = await supabase.auth.getUser(token);
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id);
    
  return NextResponse.json({ tasks });
}
```

### Benefits of API-Only Approach:

**🔒 Security:**
- No database credentials in extension code
- All authentication server-side
- Reduced attack surface

**🛠️ Maintainability:**
- Single source of truth for data logic
- Easier to update database schema
- Consistent validation and business logic

**📈 Scalability:**
- Can add caching at API level
- Rate limiting built-in
- Better monitoring and logging

**🐛 Debugging:**
- Centralized error handling
- API logs show all extension activity
- Easier to track issues

## 🌍 Environment Configuration (Extension-Specific)

**Important:** Extensions use build-time configuration, NOT runtime environment variables.

### How Extension Configuration Works:
1. **Build time**: `build.js` reads `build-config.json` and generates `config.js`
2. **Runtime**: Extension code imports `config.js` and uses `FOCUSFLOW_CONFIG`
3. **Different builds**: Each environment gets its own `config.js` file

### Development
- API URL: `http://localhost:3000`
- Debug mode: ON
- Console logging: Verbose
- Extension name: "FocusFlow Extension (development)"

### Production  
- API URL: `https://focusflow.app`
- Debug mode: OFF
- Console logging: Errors only
- Extension name: "FocusFlow Extension"

### Why Extensions Can't Use .env Files:
- Browser extensions run in a sandboxed environment
- No access to filesystem or Node.js environment
- All configuration must be bundled into the extension files
- Build-time configuration ensures proper values are embedded

## 📦 Publishing Process

### For Chrome Web Store:
1. `npm run build:prod`
2. `npm run package`
3. Upload `focusflow-extension.zip` to Chrome Web Store
4. Complete store listing
5. Submit for review

### For Firefox Add-ons:
1. `npm run build:prod`
2. Create zip manually excluding dev files
3. Upload to Firefox Add-ons Developer Hub

## 🔧 Development Workflow

1. **Make changes** to extension files
2. **Build** with `npm run build:dev`
3. **Reload extension** in Chrome (chrome://extensions/)
4. **Test** functionality
5. **Commit** changes when ready

## 🚨 Important Notes

### Required Configuration Files:
- Set up `build-config.json` with your API URLs
- Never commit generated `config.js` file to git
- Use `config.template.js` as the template for builds

### API Compatibility:
- The extension is designed to work with FocusFlow API v2 in **API-Only mode**.
- **Required API endpoints** (all handle authentication and data operations server-side):
  - `/api/extension/config`: Used to fetch extension-specific configuration and user information. This endpoint should **not** return any Supabase keys to the extension.
  - `/api/extension/tasks`: Handles all CRUD (Create, Read, Update, Delete) operations related to user tasks.
  - `/api/extension/monitor`: Used for tracking and logging user activity.
  - `/api/extension/health`: Provides system health and connectivity checks.
- **Crucially, the extension itself NEVER contacts Supabase directly.** All database operations and interactions are exclusively handled by your Next.js API endpoints.

### Chrome Web Store Requirements:
- Icons: 16x16, 48x48, 128x128 PNG files
- Manifest version 3
- Privacy policy URL (if collecting data)
- Detailed description and screenshots

## 🔗 Repository Setup

### Create GitHub Repository:
```bash
# After creating repo on GitHub
git remote add origin https://github.com/yourusername/focusflow-extension.git
git add .
git commit -m "Initial extension setup"
git push -u origin main
```

### Repository Structure:
```
main branch - Production ready code
develop branch - Development code
feature/* branches - New features
release/* branches - Release preparation
```

## 📋 Pre-launch Checklist

- [ ] Environment variables configured
- [ ] All API endpoints working
- [ ] Extension loads without errors
- [ ] Activity tracking functional
- [ ] Task management working
- [ ] Health checks passing
- [ ] Icons and branding updated
- [ ] Privacy policy created
- [ ] Store listing prepared
- [ ] Testing completed across environments

## 🆘 Troubleshooting

### Common Issues:

1. **Extension won't load:**
   - Check manifest.json syntax
   - Verify all files exist
   - Check console for errors

2. **API calls failing:**
   - Verify environment variables
   - Check CORS settings
   - Confirm API endpoints

3. **Build errors:**
   - Run `npm install`
   - Check Node.js version
   - Verify file permissions

### Getting Help:
- Check browser console for errors
- Review network requests in DevTools
- Test API endpoints directly
- Check FocusFlow backend logs

---

This setup gives you a production-ready, publishable browser extension that can be deployed independently from your main FocusFlow application.
