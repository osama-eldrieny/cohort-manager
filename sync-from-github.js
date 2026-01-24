#!/usr/bin/env node

/**
 * Sync script: Pulls from GitHub if local version doesn't match remote
 * Run with: node sync-from-github.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'sync-log.txt');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

async function syncWithGitHub() {
    try {
        log('🔄 Starting sync check with GitHub...');
        
        // Fetch latest from GitHub
        log('📥 Fetching from GitHub...');
        execSync('git fetch origin main', { stdio: 'inherit' });
        
        // Get local HEAD commit
        const localCommit = execSync('git rev-parse HEAD').toString().trim();
        log(`   Local commit: ${localCommit.substring(0, 8)}`);
        
        // Get remote HEAD commit
        const remoteCommit = execSync('git rev-parse origin/main').toString().trim();
        log(`   Remote commit: ${remoteCommit.substring(0, 8)}`);
        
        // Compare commits
        if (localCommit !== remoteCommit) {
            log('⚠️  Local version differs from GitHub - pulling changes...');
            execSync('git pull origin main', { stdio: 'inherit' });
            log('✅ Successfully pulled latest changes from GitHub');
            log('💾 Restarting server to apply changes...');
            
            // Kill existing server process
            try {
                execSync('pkill -f "node server.js" || true');
                log('   ⏹️  Old server stopped');
            } catch (e) {
                // Process might not exist, that's OK
            }
            
            // Wait a moment for process to die
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start server again
            log('   🚀 Starting new server...');
            execSync('npm start > server.log 2>&1 &');
            log('✅ Server restarted with latest code');
            
        } else {
            log('✅ Local version matches GitHub - no changes needed');
        }
        
        log('✅ Sync completed successfully\n');
        
    } catch (error) {
        log(`❌ Sync failed: ${error.message}`);
        console.error(error);
    }
}

// Run sync
syncWithGitHub();
