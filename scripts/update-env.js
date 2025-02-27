// Script to update environment variables properly
const fs = require('fs');
const path = require('path');

// The new webhook secret
const NEW_WEBHOOK_SECRET = 'whsec_ni2mS5bZ1blpp3Qz5y3E9FuXz2XL01oM';

// Function to update environment variables
function updateEnvFile(filePath, secretKey, secretValue) {
  console.log(`Updating ${filePath}...`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File ${filePath} does not exist. Creating it...`);
      fs.writeFileSync(filePath, `${secretKey}="${secretValue}"\n`);
      console.log(`✅ Created ${filePath} with new secret`);
      return true;
    }
    
    // Read existing content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the variable already exists
    const regex = new RegExp(`${secretKey}=["']?([^"'\n]*)["']?`, 'g');
    const match = regex.exec(content);
    
    if (match) {
      // Variable exists, update it
      const oldSecret = match[1];
      console.log(`Found existing secret: ${oldSecret.substring(0, 10)}...`);
      
      // Replace the old secret with the new one
      content = content.replace(
        regex,
        `${secretKey}="${secretValue}"`
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${secretKey} in ${filePath}`);
    } else {
      // Variable doesn't exist, append it
      content += `\n${secretKey}="${secretValue}"\n`;
      fs.writeFileSync(filePath, content);
      console.log(`✅ Added ${secretKey} to ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🔄 Updating environment variables...');
  
  const rootDir = process.cwd();
  const envLocalPath = path.join(rootDir, '.env.local');
  const envPath = path.join(rootDir, '.env');
  
  // Update .env.local (takes precedence in Next.js)
  const localUpdated = updateEnvFile(envLocalPath, 'STRIPE_WEBHOOK_SECRET', NEW_WEBHOOK_SECRET);
  
  // Also update .env as a fallback
  const envUpdated = updateEnvFile(envPath, 'STRIPE_WEBHOOK_SECRET', NEW_WEBHOOK_SECRET);
  
  if (localUpdated || envUpdated) {
    console.log('\n✅ Environment variables updated successfully!');
    console.log('\nIMPORTANT: You need to restart your Next.js server for the changes to take effect.');
    console.log('Run: node scripts/restart-server.js');
  } else {
    console.error('\n❌ Failed to update environment variables.');
  }
}

// Run the main function
main(); 