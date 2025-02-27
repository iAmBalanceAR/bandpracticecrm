// Test script for Stripe webhooks
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/stripe'; // Updated port to 3000
const TEST_USER_ID = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000000'; // Replace with a real UUID from your database

// Test event types
const EVENT_TYPES = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
  PRICE_CREATED: 'price.created'
};

// Create a mock subscription event
function createSubscriptionEvent(eventType) {
  const subscriptionId = `sub_test_${Math.random().toString(36).substring(2, 10)}`;
  const priceId = `price_test_${Math.random().toString(36).substring(2, 10)}`;
  const customerId = `cus_test_${Math.random().toString(36).substring(2, 10)}`;
  
  return {
    id: `evt_test_${Math.random().toString(36).substring(2, 10)}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: eventType,
    data: {
      object: {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        status: eventType === EVENT_TYPES.SUBSCRIPTION_DELETED ? 'canceled' : 'active',
        cancel_at_period_end: false,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
        items: {
          object: 'list',
          data: [
            {
              id: `si_test_${Math.random().toString(36).substring(2, 10)}`,
              object: 'subscription_item',
              price: {
                id: priceId,
                object: 'price',
                active: true,
                currency: 'usd',
                product: `prod_test_${Math.random().toString(36).substring(2, 10)}`,
                unit_amount: 1000,
                recurring: {
                  interval: 'month',
                  interval_count: 1
                }
              },
              quantity: 1
            }
          ]
        },
        metadata: {}
      }
    }
  };
}

// Create a mock customer object
function createCustomerObject(userId) {
  return {
    id: `cus_test_${Math.random().toString(36).substring(2, 10)}`,
    object: 'customer',
    metadata: {
      supabase_user_id: userId
    }
  };
}

// Create a mock payment intent event
function createPaymentIntentEvent(eventType) {
  const paymentIntentId = `pi_test_${Math.random().toString(36).substring(2, 10)}`;
  
  return {
    id: `evt_test_${Math.random().toString(36).substring(2, 10)}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: eventType,
    data: {
      object: {
        id: paymentIntentId,
        object: 'payment_intent',
        amount: 1000,
        currency: 'usd',
        status: eventType === EVENT_TYPES.PAYMENT_SUCCEEDED ? 'succeeded' : 'requires_payment_method',
        metadata: {
          subscription_id: `sub_test_${Math.random().toString(36).substring(2, 10)}`
        }
      }
    }
  };
}

// Create a mock price event
function createPriceEvent(eventType) {
  const priceId = `price_test_${Math.random().toString(36).substring(2, 10)}`;
  
  return {
    id: `evt_test_${Math.random().toString(36).substring(2, 10)}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: eventType,
    data: {
      object: {
        id: priceId,
        object: 'price',
        active: true,
        currency: 'usd',
        product: `prod_test_${Math.random().toString(36).substring(2, 10)}`,
        unit_amount: 1000,
        recurring: {
          interval: 'month',
          interval_count: 1
        }
      }
    }
  };
}

// Send a test webhook event
async function sendTestWebhook(eventType) {
  let event;
  
  // Create the appropriate event based on type
  if (eventType.startsWith('customer.subscription')) {
    event = createSubscriptionEvent(eventType);
    
    // For subscription events, we need to mock the customer retrieval
    // We'll add a special field that our webhook handler can use to identify this as a test
    event._test_customer = createCustomerObject(TEST_USER_ID);
  } else if (eventType.startsWith('payment_intent')) {
    event = createPaymentIntentEvent(eventType);
  } else if (eventType.startsWith('price')) {
    event = createPriceEvent(eventType);
  } else {
    console.error(`Unsupported event type: ${eventType}`);
    return;
  }
  
  console.log(`Sending test ${eventType} event to ${WEBHOOK_URL}`);
  console.log('Event payload:', JSON.stringify(event, null, 2));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature', // This will be ignored in development mode
        'X-Test-Event': 'true' // Custom header to identify test events
      },
      body: JSON.stringify(event)
    });
    
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Test webhook sent successfully!');
    } else {
      console.error('❌ Failed to send test webhook');
    }
  } catch (error) {
    console.error('❌ Error sending test webhook:', error);
  }
}

// Main function
async function main() {
  const eventType = process.argv[2] || EVENT_TYPES.SUBSCRIPTION_CREATED;
  
  if (!Object.values(EVENT_TYPES).includes(eventType)) {
    console.error(`Invalid event type: ${eventType}`);
    console.log('Available event types:');
    Object.entries(EVENT_TYPES).forEach(([key, value]) => {
      console.log(`- ${value}`);
    });
    process.exit(1);
  }
  
  await sendTestWebhook(eventType);
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 