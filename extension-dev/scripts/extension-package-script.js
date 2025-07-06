#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function packageExtension() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  const buildDir = path.join(__dirname, '../dist');
  const outputFile = path.join(__dirname, '../', `focusflow-extension-v${version}.zip`);
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run "npm run build:prod" first.');
    process.exit(1);
  }
  
  console.log(`📦 Packaging extension v${version}...`);
  
  const output = fs.createWriteStream(outputFile);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Extension packaged successfully!`);
      console.log(`📁 File: ${outputFile}`);
      console.log(`📏 Size: ${sizeInMB} MB`);
      console.log(`\n🚀 Ready to upload to Chrome Web Store!`);
      resolve();
    });
    
    archive.on('error', (err) => {
      console.error('❌ Error creating package:', err);
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add all files from build directory
    archive.directory(buildDir, false);
    
    archive.finalize();
  });
}

if (require.main === module) {
  packageExtension().catch(console.error);
}

module.exports = { packageExtension };
