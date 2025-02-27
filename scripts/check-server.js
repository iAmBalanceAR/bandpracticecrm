// Script to check if the server is running and test the webhook
import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:3000'; // Updated port to 3000
const ENV_CHECK_URL = `${BASE_URL}/api/env-check`;
const TEST_WEBHOOK_URL = `${BASE_URL}/api/test-webhook`;

// Function to check if a URL is accessible
async function checkUrl(url, description) {
  console.log(`Checking ${description} at ${url}...`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`✅ ${description} is accessible (Status: ${response.status})`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Error accessing ${description}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  console.log('🔄 Checking server and webhook...');
  
  try {
    // Check if the server is running
    const serverCheck = await fetch(BASE_URL).catch(() => null);
    
    if (!serverCheck) {
      throw new Error('❌ Server is not running. Please start the server with \'pnpm dev\'');
    }
    
    console.log('✅ Server is running');
    
    // Check environment variables
    const envCheck = await checkUrl(ENV_CHECK_URL, 'Environment variables');
    
    // Test webhook
    if (envCheck.success) {
      console.log('\n🔄 Testing webhook...');
      const webhookCheck = await checkUrl(TEST_WEBHOOK_URL, 'Webhook test');
      
      if (webhookCheck.success) {
        console.log('\n✅ All checks completed successfully!');
      }
    }
  } catch (error) {
    console.error(`❌ Error accessing Server: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 