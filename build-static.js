#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

console.log('Building static version...');

// Build the frontend
execSync('npm run build', { stdio: 'inherit' });

// Create a simple deployment-ready version
const distPath = './dist/public';
const indexPath = path.join(distPath, 'index.html');

try {
  // Read the built index.html
  let indexContent = await fs.readFile(indexPath, 'utf-8');
  
  // Add Telegram Web App script and base configuration
  const telegramScript = `
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script>
      // Initialize Telegram Web App
      window.Telegram = window.Telegram || {};
      window.Telegram.WebApp = window.Telegram.WebApp || {
        ready: () => console.log('Telegram Web App ready'),
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: 'Demo',
            username: 'demo_user'
          }
        },
        MainButton: {
          setText: () => {},
          show: () => {},
          hide: () => {}
        }
      };
      
      // Mock API responses for demo
      window.mockApiData = {
        player: {
          id: '1',
          userId: '123456789',
          coins: 2500,
          experience: 1500,
          level: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    </script>
  `;
  
  // Insert before closing head tag
  indexContent = indexContent.replace('</head>', `  ${telegramScript}</head>`);
  
  // Write back the modified content
  await fs.writeFile(indexPath, indexContent);
  
  console.log('✅ Static build completed successfully!');
  console.log('📂 Deploy folder: dist/public');
  
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}