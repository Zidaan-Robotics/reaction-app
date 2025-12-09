import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

function checkEnvFile() {
  try {
    const envPath = join(rootDir, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    const missing = requiredVars.filter(varName => !envVars[varName]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nPlease make sure your .env file contains all required Firebase configuration variables.');
      process.exit(1);
    }

    console.log('✅ All required environment variables found in .env file');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ .env file not found!');
      console.error('\nPlease create a .env file in the root directory with your Firebase configuration.');
      console.error('Required variables:');
      requiredVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nSee README.md for setup instructions.');
      process.exit(1);
    } else {
      console.error('❌ Error reading .env file:', error.message);
      process.exit(1);
    }
  }
}

checkEnvFile();

