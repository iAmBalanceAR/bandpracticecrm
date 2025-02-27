import { NextResponse } from 'next/server';

export async function GET() {
  // Only show first few characters of secrets for security
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET 
    ? `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}...` 
    : 'not set';
  
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    ? `${process.env.STRIPE_SECRET_KEY.substring(0, 10)}...`
    : 'not set';
    
  return NextResponse.json({
    message: 'Environment variables check',
    env: process.env.NODE_ENV,
    stripeWebhookSecret,
    stripeSecretKey,
    timestamp: new Date().toISOString()
  });
} 