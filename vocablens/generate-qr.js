#!/usr/bin/env node

const os = require('os');
const qrcode = require('qrcode-terminal');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();
const expoUrl = `exp://${localIP}:19000`;

console.log('📱 Vocl - Expo QR Code Generator');
console.log('=====================================');
console.log(`Your local IP: ${localIP}`);
console.log(`Expo URL: ${expoUrl}`);
console.log('');
console.log('Scan this QR code with Expo Go app:');
console.log('');

// Generate QR code in terminal
qrcode.generate(expoUrl, { small: true }, (qr) => {
  console.log(qr);
});

console.log('');
console.log('📋 Instructions:');
console.log('1. Make sure Expo development server is running: npx expo start');
console.log('2. Install Expo Go app on your phone');
console.log('3. Scan this QR code with Expo Go');
console.log('4. Test the Vocl app features');
console.log('');
console.log('🚀 If QR code doesn\'t work:');
console.log('- Make sure your phone and computer are on the same WiFi network');
console.log('- Try "Connection" menu in Expo Go for alternative options');
console.log('- Check that port 19000 is not blocked by firewall');