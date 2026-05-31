#!/usr/bin/env node
/**
 * MicBoard Pro — Build Script
 * Automates the full build pipeline: icon → React → Electron → EXE
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const log = (msg, color = '\x1b[36m') => console.log(`${color}[MicBoard Build]\x1b[0m ${msg}`);
const ok  = (msg) => log(`✅ ${msg}`, '\x1b[32m');
const err = (msg) => { log(`❌ ${msg}`, '\x1b[31m'); process.exit(1); };

async function run(cmd, cwd = ROOT) {
  log(`Running: ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

async function build() {
  log('🚀 Starting MicBoard Pro build...\n');

  // 1. Create icon
  log('Step 1/4 — Generating icons...');
  try { await run('node scripts/create-icon.js'); ok('Icons ready'); }
  catch(e) { log('⚠️  Icon generation failed, using fallback'); }

  // 2. Install dependencies
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    log('Step 2/4 — Installing dependencies (this may take a few minutes)...');
    await run('npm install');
    ok('Dependencies installed');
  } else {
    ok('Dependencies already installed');
  }

  // 3. Build React
  log('Step 3/4 — Building React app...');
  process.env.CI = 'false'; // Allow warnings without failing
  await run('npm run react-build');
  ok('React build complete');

  // 4. Build Electron EXE
  log('Step 4/4 — Building Windows EXE installer...');
  await run('npx electron-builder build --win --x64');
  ok('EXE build complete!');

  // Done
  const distDir = path.join(ROOT, 'dist');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    log('\n📦 Output files:');
    files.forEach(f => {
      const stat = fs.statSync(path.join(distDir, f));
      const size = (stat.size / 1024 / 1024).toFixed(1);
      console.log(`   dist/${f} (${size} MB)`);
    });
  }

  console.log('\n\x1b[32m╔══════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[32m║  MicBoard Pro build successful! 🎉    ║\x1b[0m');
  console.log('\x1b[32m║  Check the dist/ folder for your EXE  ║\x1b[0m');
  console.log('\x1b[32m╚══════════════════════════════════════╝\x1b[0m\n');
}

build().catch(e => err(e.message));
