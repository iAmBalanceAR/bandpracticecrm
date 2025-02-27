import { NextResponse } from 'next/server';

export async function GET() {
  // Get all environment variables related to Stripe
  const envVars = {
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET 
      ? `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}...` 
      : 'not set',
    STRIPE_WEBHOOK_SECRET_SUBSCRIPTION: process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION
      ? `${process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION.substring(0, 10)}...`
      : 'not set',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
      ? `${process.env.STRIPE_SECRET_KEY.substring(0, 10)}...`
      : 'not set',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    // Add timestamp to prevent caching
    timestamp: new Date().toISOString(),
    pid: process.pid
  };
  
  return NextResponse.json(envVars);
} 