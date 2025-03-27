import fetch from 'node-fetch';

const LOCAL_WEBHOOK_URL = 'http://localhost:3000/api/webhooks/stripe';
const TEST_EVENT = {
  type: 'test_webhook',
  data: {
    object: {
      id: 'test_123',
      customer: 'cus_test',
      subscription: 'sub_test',
      status: 'active'
    }
  }
};

async function testWebhook() {
  try {
    console.log('🔄 Testing webhook endpoint...');
    
    const response = await fetch(LOCAL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature'
      },
      body: JSON.stringify(TEST_EVENT)
    });

    const text = await response.text();
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📝 Response body: ${text}`);
    
    if (response.ok) {
      console.log('✅ Webhook test completed successfully');
    } else {
      console.error('❌ Webhook test failed');
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
  }
}

testWebhook(); 