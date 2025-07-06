#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Build configuration
const BUILD_DIR = '../dist';
// Note: Source files should be in the same directory as this script or specified separately
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:3000',
    DEBUG: true,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_BASE_URL: 'https://staging.focusflow.app',
    DEBUG: false,
    LOG_LEVEL: 'info'
  },
  production: {
    API_BASE_URL: 'https://focusflow.app',
    DEBUG: false,
    LOG_LEVEL: 'error'
  }
};

function buildExtension(environment = 'development') {
  console.log(`Building extension for ${environment} environment...`);
  
  // Create build directory
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }
  
  // Get environment configuration
  const envConfig = environments[environment];
  if (!envConfig) {
    console.error(`Unknown environment: ${environment}`);
    process.exit(1);
  }
  
  // Generate config.js with environment-specific values
  const configContent = `// Auto-generated configuration for ${environment}
const FOCUSFLOW_CONFIG = {
  ENVIRONMENT: '${environment}',
  API_BASE_URL: '${envConfig.API_BASE_URL}',
  DEBUG: ${envConfig.DEBUG},
  LOG_LEVEL: '${envConfig.LOG_LEVEL}',
  
  getCurrentConfig() {
    return {
      API_BASE_URL: this.API_BASE_URL,
      DEBUG: this.DEBUG,
      LOG_LEVEL: this.LOG_LEVEL
    };
  },
  
  getApiBaseUrl() {
    return this.API_BASE_URL;
  },
  
  getApiUrl(endpoint) {
    return \`\${this.getApiBaseUrl()}\${endpoint}\`;
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.FOCUSFLOW_CONFIG = FOCUSFLOW_CONFIG;
}`;
  
  // Write generated config
  fs.writeFileSync(path.join(BUILD_DIR, 'config.js'), configContent);
  
  // Copy other files (assuming they're in the same directory as the script)
  // Note: You'll need to place your extension source files in the scripts directory
  // or modify this to point to your source location
  const filesToCopy = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.js',
    'README.md'
  ];
  
  console.log('⚠️  Note: Place your extension source files in the scripts/ directory');
  console.log('⚠️  Or modify the build script to point to your source location');
  
  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(BUILD_DIR, file));
      console.log(`✅ Copied ${file}`);
    } else {
      console.warn(`⚠️  File not found: ${file}`);
    }
  });
  
  // Copy icons directory if it exists
  if (fs.existsSync('icons')) {
    const iconsDestDir = path.join(BUILD_DIR, 'icons');
    if (!fs.existsSync(iconsDestDir)) {
      fs.mkdirSync(iconsDestDir, { recursive: true });
    }
    
    fs.readdirSync('icons').forEach(icon => {
      fs.copyFileSync(path.join('icons', icon), path.join(iconsDestDir, icon));
    });
    console.log('✅ Copied icons directory');
  }
  
  // Update manifest.json version if in production
  if (environment === 'production') {
    const manifestPath = path.join(BUILD_DIR, 'manifest.json');
    const packageJsonPath = path.join(__dirname, '../package.json');
    if (fs.existsSync(manifestPath) && fs.existsSync(packageJsonPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      manifest.version = packageJson.version;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`✅ Updated manifest version to ${packageJson.version}`);
    }
  }
  
  console.log(`\n✅ Extension built successfully for ${environment}!`);
  console.log(`📁 Build output: ${BUILD_DIR}/`);
  console.log(`🌐 API Base URL: ${envConfig.API_BASE_URL}`);
  console.log(`🐛 Debug Mode: ${envConfig.DEBUG}`);
}

// Get environment from command line argument
const environment = process.argv[2] || process.env.ENVIRONMENT || 'development';
buildExtension(environment);

module.exports = { buildExtension };
