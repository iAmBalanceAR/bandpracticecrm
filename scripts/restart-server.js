// Script to restart the Next.js server with a clean environment
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Enable more detailed logging
const DEBUG = true;

function log(message) {
  console.log(message);
}

function debug(message) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`);
  }
}

function error(message, err) {
  console.error(`❌ ${message}`);
  if (err) {
    console.error(err instanceof Error ? err.stack : String(err));
  }
}

// Main function to run all steps
async function main() {
  try {
    log('🔄 Restarting Next.js server with clean environment...');

    // Step 1: Kill any running Next.js processes - using a safer approach
    log('Stopping any running Next.js processes...');
    debug('Finding Node.js processes...');
    
    try {
      // Use a safer approach that doesn't kill all Node processes
      exec('wmic process where "name=\'node.exe\' and commandline like \'%next%\'" call terminate', (err, stdout, stderr) => {
        if (err) {
          debug(`Process termination error: ${err.message}`);
          log('No Next.js processes found or could not stop them');
        } else {
          debug(`Process termination output: ${stdout}`);
          log('✅ Stopped running Next.js processes');
        }
        
        // Continue with the next steps regardless of the outcome
        cleanCache();
      });
    } catch (err) {
      error('Error stopping processes', err);
      // Continue with the next steps
      cleanCache();
    }
  } catch (err) {
    error('Unhandled error in main function', err);
    showFinalInstructions();
  }
}

// Step 2: Clean the Next.js cache
function cleanCache() {
  try {
    log('Cleaning Next.js cache...');
    const nextCachePath = path.join(process.cwd(), '.next');
    debug(`Next.js path: ${nextCachePath}`);
    
    if (fs.existsSync(nextCachePath)) {
      debug(`Next.js directory exists`);
      // Only remove the cache directory, not the entire .next folder
      const cachePath = path.join(nextCachePath, 'cache');
      debug(`Cache path: ${cachePath}`);
      
      if (fs.existsSync(cachePath)) {
        debug(`Cache directory exists, removing...`);
        fs.rmSync(cachePath, { recursive: true, force: true });
        log('✅ Removed .next/cache directory');
      } else {
        debug(`Cache directory does not exist`);
        log('No cache directory found to clean');
      }
    } else {
      debug(`Next.js directory does not exist`);
      log('No .next directory found');
    }
  } catch (err) {
    error('Error cleaning cache', err);
  }
  
  // Continue to the next step
  checkEnvVars();
}

// Step 3: Verify environment variables
function checkEnvVars() {
  try {
    log('Checking environment variables...');
    const envPath = path.join(process.cwd(), '.env.local');
    debug(`Env path: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      debug(`Env file exists`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      debug(`Env file size: ${envContent.length} bytes`);
      
      if (envContent.includes('STRIPE_WEBHOOK_SECRET=') || envContent.includes('STRIPE_WEBHOOK_SECRET="')) {
        log('✅ Found STRIPE_WEBHOOK_SECRET in .env.local');
        
        // Extract the secret for verification
        const match = envContent.match(/STRIPE_WEBHOOK_SECRET=["']?([^"'\n]*)["']?/);
        if (match && match[1]) {
          log(`Secret starts with: ${match[1].substring(0, 10)}...`);
        } else {
          debug(`Could not extract secret value`);
        }
      } else {
        log('⚠️ STRIPE_WEBHOOK_SECRET not found in .env.local');
      }
    } else {
      log('⚠️ .env.local file not found');
    }
  } catch (err) {
    error('Error checking environment variables', err);
  }
  
  // Show final instructions
  showFinalInstructions();
}

// Step 4: Show instructions for starting the server
function showFinalInstructions() {
  log('Starting Next.js server...');
  log('Run the following command in your terminal:');
  log('\npnpm dev\n');

  log('After the server starts, check the environment variables at:');
  log('http://localhost:3001/api/env-check');
  log('And test the webhook at:');
  log('http://localhost:3001/api/test-webhook');
  
  log('\n✅ Restart preparation completed successfully!');
}

// Start the main function
main(); 