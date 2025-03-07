/**
 * Reset Rate Limit Helper
 * 
 * This script helps reset Supabase rate limits by providing instructions
 * and checking the current rate limit status.
 * 
 * Run with: node scripts/reset-rate-limit.js
 */

const https = require('https');
const readline = require('readline');

console.log(`
=================================================
SUPABASE RATE LIMIT RESET HELPER
=================================================

This script will help you recover from Supabase rate limits:

1. Check your current rate limit status
2. Provide instructions to clear local storage and cookies
3. Wait for rate limits to reset (typically 15-60 minutes)

Let's get started!
`);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check the current rate limit status
function checkRateLimit() {
  console.log('\nChecking current rate limit status...');
  
  const options = {
    hostname: 'xasfpbzzvsgzvdpjqwqe.supabase.co',
    port: 443,
    path: '/auth/v1/token',
    method: 'HEAD',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    // Check for rate limit headers
    const remaining = res.headers['x-ratelimit-remaining'];
    const reset = res.headers['x-ratelimit-reset'];
    
    if (remaining) {
      console.log(`Requests remaining: ${remaining}`);
    }
    
    if (reset) {
      console.log(`Rate limit resets in: ${reset} seconds`);
    }
    
    if (res.statusCode === 429) {
      console.log('\n⚠️ You are currently rate limited!');
      showRecoveryInstructions();
    } else {
      console.log('\n✅ You are not currently rate limited.');
      askForNextStep();
    }
  });
  
  req.on('error', (e) => {
    console.error(`Error checking rate limit: ${e.message}`);
    showRecoveryInstructions();
  });
  
  req.end();
}

// Show instructions for recovering from rate limits
function showRecoveryInstructions() {
  console.log(`
=================================================
RECOVERY INSTRUCTIONS
=================================================

1. Clear your browser's local storage and cookies:
   
   Chrome:
   - Open DevTools (F12)
   - Go to Application tab
   - Select "Local Storage" and clear all items from your domain
   - Select "Cookies" and clear all cookies from your domain
   
   Firefox:
   - Open DevTools (F12)
   - Go to Storage tab
   - Select "Local Storage" and clear all items
   - Select "Cookies" and clear all cookies
   
2. Use the Auth Debug button in your app to clear auth state
   
3. Wait at least 15 minutes before trying again
   
4. Try using a different IP address if possible
   (mobile hotspot, VPN, etc.)
   
5. Restart your development server
   
=================================================
`);
  
  askForNextStep();
}

// Ask the user what they want to do next
function askForNextStep() {
  rl.question('\nWhat would you like to do?\n1. Check rate limit status again\n2. Exit\n\nChoice: ', (answer) => {
    if (answer === '1') {
      checkRateLimit();
    } else {
      console.log('\nGoodbye! Remember to implement proper rate limit handling in your code.');
      rl.close();
    }
  });
}

// Start the script
checkRateLimit(); 