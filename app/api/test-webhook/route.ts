import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function GET() {
  try {
    console.log('🔄 Running webhook test...');
    
    // Path to the test script
    const scriptPath = path.join(process.cwd(), 'scripts/test-webhook-local.mjs');
    
    // Execute the test script
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
    
    // Log the output
    console.log('Test script output:', stdout);
    if (stderr) {
      console.error('Test script errors:', stderr);
    }
    
    // Return the result
    return NextResponse.json({
      success: true,
      message: 'Webhook test completed',
      output: stdout,
      errors: stderr || null,
      timestamp: new Date().toISOString(),
      processId: process.pid
    });
  } catch (error) {
    console.error('Error running webhook test:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Webhook test failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      processId: process.pid
    }, { status: 500 });
  }
} 