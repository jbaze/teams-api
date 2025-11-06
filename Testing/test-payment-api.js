// Test script for Payment API endpoints
// Run with: node test-payment-api.js

const BASE_URL = 'http://localhost:3000';

async function testPaymentAPI() {
  console.log('💳 Starting Payment API Tests...\n');

  let sessionId = null;
  const testTeamId = 'team-' + Date.now();

  // Test 1: Get available prices
  console.log('1️⃣  Testing GET /api/v1/payments/prices...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/payments/prices`);
    const data = await response.json();
    console.log('✅ Available Prices:', data);
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  // Test 2: Create checkout session
  console.log('2️⃣  Testing POST /api/v1/payments/create-checkout-session...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId: testTeamId,
        teamName: 'Test Team Alpha',
        priceId: 'price_1SQOyhPIlfT968CUdrbeDRTm',
        quantity: 1,
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel'
      })
    });

    const data = await response.json();
    sessionId = data.sessionId;
    
    console.log('✅ Checkout Session Created:', {
      sessionId: data.sessionId,
      checkoutUrl: data.url,
      publicKey: data.publicKey?.substring(0, 20) + '...'
    });
    console.log('');
    console.log('🔗 Open this URL to complete payment:');
    console.log(data.url);
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  // Wait for user to potentially make a payment
  console.log('⏳ Waiting 5 seconds before checking session...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 3: Get session details
  if (sessionId) {
    console.log('3️⃣  Testing GET /api/v1/payments/session/:sessionId...');
    try {
      const response = await fetch(`${BASE_URL}/api/v1/payments/session/${sessionId}`);
      const data = await response.json();
      console.log('✅ Session Details:', {
        sessionId: data.session.id,
        teamId: data.session.teamId,
        teamName: data.session.teamName,
        status: data.session.status,
        amount: data.session.amount,
        currency: data.session.currency
      });
      console.log('');
    } catch (error) {
      console.error('❌ Failed:', error.message);
    }

    // Test 4: Verify payment
    console.log('4️⃣  Testing GET /api/v1/payments/verify/:sessionId...');
    try {
      const response = await fetch(`${BASE_URL}/api/v1/payments/verify/${sessionId}`);
      const data = await response.json();
      console.log('✅ Payment Verification:', {
        verified: data.verified,
        status: data.status,
        teamId: data.teamId
      });
      console.log('');
    } catch (error) {
      console.error('❌ Failed:', error.message);
    }

    // Test 5: Get team payments
    console.log('5️⃣  Testing GET /api/v1/payments/team/:teamId...');
    try {
      const response = await fetch(`${BASE_URL}/api/v1/payments/team/${testTeamId}`);
      const data = await response.json();
      console.log('✅ Team Payments:', {
        teamId: data.teamId,
        totalPayments: data.totalPayments,
        paidPayments: data.paidPayments,
        payments: data.payments
      });
      console.log('');
    } catch (error) {
      console.error('❌ Failed:', error.message);
    }
  }

  // Test 6: Create another session with different team
  console.log('6️⃣  Testing POST /api/v1/payments/create-checkout-session (Another Team)...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId: 'team-' + (Date.now() + 1),
        teamName: 'Test Team Beta',
        quantity: 1
      })
    });

    const data = await response.json();
    console.log('✅ Second Checkout Session Created:', {
      sessionId: data.sessionId,
      url: data.url?.substring(0, 50) + '...'
    });
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  // Test 7: Error handling - missing teamId
  console.log('7️⃣  Testing Error Handling (Missing teamId)...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamName: 'Test Team Without ID'
      })
    });

    const data = await response.json();
    console.log('✅ Error Response:', {
      status: response.status,
      error: data.error,
      message: data.message
    });
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  console.log('✅ All payment tests completed!\n');
  console.log('📝 Notes:');
  console.log('   - Use Stripe test cards to complete payments');
  console.log('   - Test card: 4242 4242 4242 4242');
  console.log('   - Any future expiry date and any CVC');
  console.log('   - Visit: https://stripe.com/docs/testing\n');
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ for native fetch support.');
  console.log('Please upgrade Node.js or use a fetch polyfill.\n');
  process.exit(1);
}

// Run tests
testPaymentAPI().catch(console.error);
