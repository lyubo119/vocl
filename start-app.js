#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vocl App...');
console.log('================================');

// Change to the correct directory
const appDir = path.resolve(__dirname);
console.log(`Working directory: ${appDir}`);

// Check if we're in the right location
if (!__dirname.endsWith('vocl')) {
  console.log('❌ Error: This script must be run from the vocl directory');
  console.log('Please run: cd /c/Users/vashl/source/repos/vocl');
  console.log('Then run: node start-app.js');
  process.exit(1);
}

// Start Expo server
console.log('📱 Starting Expo development server...');
const expoProcess = exec('npx expo start', {
  cwd: appDir,
  stdio: 'inherit'
});

expoProcess.on('error', (err) => {
  console.log('❌ Failed to start Expo:', err.message);
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Make sure you have Node.js installed (v18+)');
  console.log('2. Run: npm install');
  console.log('3. Try: npx expo start --clear');
});

expoProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Expo server stopped');
  } else {
    console.log(`❌ Expo server exited with code ${code}`);
  }
});