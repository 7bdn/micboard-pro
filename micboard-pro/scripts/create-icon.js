#!/usr/bin/env node
/**
 * Creates a simple PNG icon for MicBoard Pro
 * Run: node scripts/create-icon.js
 */
const fs = require('fs');
const path = require('path');

// Create a minimal 256x256 PNG with MicBoard colors
// Using raw PNG format
const size = 256;

// We'll create an SVG first then describe it as a base64 PNG placeholder
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1200"/>
      <stop offset="100%" style="stop-color:#0a0a0a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#e8c87b"/>
      <stop offset="100%" style="stop-color:#8a6020"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="48" fill="url(#bg)"/>
  <rect width="256" height="256" rx="48" fill="none" stroke="#c8a86b" stroke-width="4" opacity="0.5"/>
  <!-- Mic body -->
  <rect x="104" y="60" width="48" height="80" rx="24" fill="url(#gold)"/>
  <!-- Mic stand -->
  <path d="M 80 160 Q 80 200 128 200 Q 176 200 176 160" fill="none" stroke="#c8a86b" stroke-width="8" stroke-linecap="round"/>
  <line x1="128" y1="200" x2="128" y2="220" stroke="#c8a86b" stroke-width="8" stroke-linecap="round"/>
  <line x1="100" y1="220" x2="156" y2="220" stroke="#c8a86b" stroke-width="8" stroke-linecap="round"/>
  <!-- Sound waves -->
  <path d="M 68 130 Q 60 128 68 120" fill="none" stroke="#c8a86b" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
  <path d="M 56 138 Q 44 128 56 110" fill="none" stroke="#c8a86b" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
  <path d="M 188 130 Q 196 128 188 120" fill="none" stroke="#c8a86b" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
  <path d="M 200 138 Q 212 128 200 110" fill="none" stroke="#c8a86b" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
</svg>`;

const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

fs.writeFileSync(path.join(assetsDir, 'icon.svg'), svgIcon);

// Create a minimal valid 1x1 ICO as placeholder (real one needs proper tooling)
// This is a valid minimal Windows ICO file (1x1 pixel, 32bpp)
const icoData = Buffer.from([
  0x00,0x00, // Reserved
  0x01,0x00, // Type: ICO
  0x01,0x00, // Count: 1 image
  // ICONDIRENTRY
  0x01,       // Width: 1
  0x01,       // Height: 1
  0x00,       // Color count
  0x00,       // Reserved
  0x01,0x00,  // Planes
  0x20,0x00,  // Bit count: 32
  0x28,0x00,0x00,0x00, // Size of image data
  0x16,0x00,0x00,0x00, // Offset of image data
  // BITMAPINFOHEADER
  0x28,0x00,0x00,0x00, // Header size
  0x01,0x00,0x00,0x00, // Width: 1
  0x02,0x00,0x00,0x00, // Height: 2 (double for ICO format)
  0x01,0x00,           // Planes
  0x20,0x00,           // Bit count
  0x00,0x00,0x00,0x00, // Compression
  0x00,0x00,0x00,0x00, // Image size
  0x00,0x00,0x00,0x00, // X pixels per meter
  0x00,0x00,0x00,0x00, // Y pixels per meter
  0x00,0x00,0x00,0x00, // Colors used
  0x00,0x00,0x00,0x00, // Colors important
  // Pixel data (BGRA)
  0x20,0xa8,0xc8,0xff, // Gold color pixel
  // AND mask
  0x00,0x00,0x00,0x00,
]);

fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoData);

// Create tray icon (tiny PNG-like placeholder)
fs.writeFileSync(path.join(assetsDir, 'tray.png'), icoData);

console.log('✅ Icons created in assets/');
console.log('📝 For production: replace assets/icon.ico with a proper 256x256 ICO file');
console.log('   You can convert assets/icon.svg to ICO using: https://convertio.co/svg-ico/');
