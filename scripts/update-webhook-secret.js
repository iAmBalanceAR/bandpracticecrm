// Script to update the Stripe webhook secret in environment files
const fs = require('fs');
const path = require('path');

// Get the new webhook secret from command line arguments
const newSecret = process.argv[2];

if (!newSecret || !newSecret.startsWith('whsec_')) {
  console.error('Please provide a valid webhook secret starting with "whsec_"');
  console.error('Usage: node update-webhook-secret.js whsec_your_secret_here');
  process.exit(1);
}

// Files to update
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local'
];

// Update each file if it exists
let updatedCount = 0;

envFiles.forEach(filename => {
  const filePath = path.join(process.cwd(), filename);
  
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if the file contains the webhook secret
      if (content.includes('STRIPE_WEBHOOK_SECRET=') || content.includes('STRIPE_WEBHOOK_SECRET="')) {
        // Replace the existing secret
        const updatedContent = content.replace(
          /STRIPE_WEBHOOK_SECRET=["']?[^"'\n]*["']?/g,
          `STRIPE_WEBHOOK_SECRET="${newSecret}"`
        );
        
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`✅ Updated webhook secret in ${filename}`);
        updatedCount++;
      } else {
        // Add the webhook secret if it doesn't exist
        const newLine = `\nSTRIPE_WEBHOOK_SECRET="${newSecret}"\n`;
        fs.appendFileSync(filePath, newLine, 'utf8');
        console.log(`✅ Added webhook secret to ${filename}`);
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error updating ${filename}:`, error.message);
    }
  }
});

if (updatedCount === 0) {
  console.log('No environment files were found or updated.');
  console.log('Creating .env.local with the webhook secret...');
  
  try {
    fs.writeFileSync(
      path.join(process.cwd(), '.env.local'),
      `STRIPE_WEBHOOK_SECRET="${newSecret}"\n`,
      'utf8'
    );
    console.log('✅ Created .env.local with the webhook secret');
  } catch (error) {
    console.error('❌ Error creating .env.local:', error.message);
  }
} else {
  console.log(`\n✅ Updated webhook secret in ${updatedCount} file(s)`);
}

console.log('\n⚠️ Remember to restart your application for changes to take effect!'); 