# FocusFlow Extension Development

This folder contains all extension-related development files and documentation.

## 📁 Folder Structure

```
extension-dev/
├── docs/             # All extension documentation
├── scripts/          # Build and packaging scripts
├── templates/        # Template files for setup
├── dist/             # Built extension (generated)
└── README.md         # This file
```

## 🚀 Quick Start

### 1. Build Extension for Development
```bash
cd extension-dev
npm run build:dev
```

### 2. Load Extension in Chrome
```bash
# Go to chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked" and select: extension-dev/dist/
```

### 3. Build for Production
```bash
npm run build:prod
```

### 4. Package for Chrome Web Store
```bash
npm run package
```

## 📚 Documentation

- [Setup Instructions](./docs/EXTENSION_SETUP_INSTRUCTIONS.md)
- [API Test Results](./docs/EXTENSION_API_TEST_RESULTS.md)
- [Update Checklist](./docs/EXTENSION_UPDATE_CHECKLIST.md)
- [Migration Guide](./docs/EXTENSION_MIGRATION.md)
- [Deployment Strategy](./docs/EXTENSION_DEPLOYMENT_STRATEGY.md)

## 🔧 Development Workflow

1. **Setup**: Use template files to create a new extension project
2. **Build**: Use scripts to build extension for different environments
3. **Test**: Load built extension in Chrome developer mode from `dist/` folder
4. **Deploy**: Package and upload to Chrome Web Store

## 📦 How to Use

### For New Extension Projects
1. Copy templates from `templates/` folder
2. Create your extension source files (manifest.json, background.js, etc.)
3. Use build scripts to compile for different environments
4. Load from `dist/` folder in Chrome

### Build Process
The build scripts will:
- Generate environment-specific configuration
- Copy source files to `dist/` folder
- Prepare extension for Chrome Web Store submission

## 🌐 API Endpoints

All extension APIs are working and tested:
- ✅ `/api/extension/health` - Health check
- ✅ `/api/extension/config` - Configuration
- ✅ `/api/extension/tasks` - Task management
- ✅ `/api/extension/monitor` - Activity monitoring

## 📦 Templates

Use template files in `templates/` folder to:
- Set up environment variables
- Configure package.json
- Set up .gitignore for new extension repositories
