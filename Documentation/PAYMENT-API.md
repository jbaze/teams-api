# 💳 Payment API Documentation

Complete guide for integrating Stripe payments into the Teams API.

## 📋 Table of Contents

1. [Setup](#setup)
2. [Payment Endpoints](#payment-endpoints)
3. [Testing](#testing)
4. [Stripe Webhooks](#stripe-webhooks)
5. [Frontend Integration](#frontend-integration)
6. [Testing with Stripe Test Cards](#testing-with-stripe-test-cards)

---

## 🔧 Setup

### 1. Environment Variables

Create a `.env` file with your Stripe credentials:

```env
STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PRICE_ID=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm run dev
```

---

## 🚀 Payment Endpoints

### Base URL
- Local: `http://localhost:3000/api/v1/payments`
- Production: `https://your-domain.vercel.app/api/v1/payments`

---

## 1. Create Checkout Session

Create a Stripe Checkout session for team payment.

**Endpoint:** `POST /api/v1/payments/create-checkout-session`

**Request Body:**

```json
{
  "teamId": "team-123",
  "teamName": "Team Exposure",
  "priceId": "price_1SQOyhPIlfT968CUdrbeDRTm",
  "quantity": 1,
  "successUrl": "https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://yourdomain.com/cancel"
}
```

**Parameters:**
- `teamId` (required) - Unique identifier for the team
- `teamName` (optional) - Name of the team
- `priceId` (optional) - Stripe Price ID (defaults to configured price)
- `quantity` (optional) - Quantity to purchase (default: 1)
- `successUrl` (optional) - URL to redirect after successful payment
- `cancelUrl` (optional) - URL to redirect if payment is cancelled

**Response:**

```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0",
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "publicKey": "pk_test_51SPufq..."
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/payments/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "team-123",
    "teamName": "Team Exposure",
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/cancel"
  }'
```

**Usage Flow:**
1. Create checkout session
2. Redirect user to the returned `url`
3. User completes payment on Stripe
4. User is redirected to your `successUrl` with `session_id` parameter

---

## 2. Get Session Details

Retrieve complete details of a payment session.

**Endpoint:** `GET /api/v1/payments/session/:sessionId`

**Response:**

```json
{
  "session": {
    "id": "cs_test_a1b2c3d4e5f6g7h8i9j0",
    "teamId": "team-123",
    "teamName": "Team Exposure",
    "status": "paid",
    "amount": 5000,
    "currency": "usd",
    "paymentIntent": "pi_test_1234567890",
    "customerEmail": "customer@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example:**

```bash
curl http://localhost:3000/api/v1/payments/session/cs_test_a1b2c3d4e5f6g7h8i9j0
```

---

## 3. Verify Payment

Verify if a payment has been completed successfully.

**Endpoint:** `GET /api/v1/payments/verify/:sessionId`

**Response (Paid):**

```json
{
  "verified": true,
  "status": "paid",
  "teamId": "team-123",
  "amount": 5000,
  "currency": "usd",
  "customerEmail": "customer@example.com"
}
```

**Response (Pending):**

```json
{
  "verified": false,
  "status": "unpaid",
  "teamId": "team-123"
}
```

**Example:**

```bash
curl http://localhost:3000/api/v1/payments/verify/cs_test_a1b2c3d4e5f6g7h8i9j0
```

---

## 4. Get Team Payments

Get all payment sessions for a specific team.

**Endpoint:** `GET /api/v1/payments/team/:teamId`

**Response:**

```json
{
  "teamId": "team-123",
  "payments": [
    {
      "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0",
      "teamId": "team-123",
      "teamName": "Team Exposure",
      "amount": 5000,
      "status": "paid",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "paidAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "totalPayments": 1,
  "paidPayments": 1
}
```

**Example:**

```bash
curl http://localhost:3000/api/v1/payments/team/team-123
```

---

## 5. Get Available Prices

Get list of available products/prices.

**Endpoint:** `GET /api/v1/payments/prices`

**Response:**

```json
{
  "prices": [
    {
      "id": "price_1SQOyhPIlfT968CUdrbeDRTm",
      "productName": "Team Registration",
      "currency": "usd",
      "type": "one_time"
    }
  ]
}
```

**Example:**

```bash
curl http://localhost:3000/api/v1/payments/prices
```

---

## 6. Webhook Endpoint

Receive real-time payment events from Stripe.

**Endpoint:** `POST /api/v1/payments/webhook`

**Headers:**
- `stripe-signature`: Stripe webhook signature for verification

**Supported Events:**
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment intent succeeded
- `payment_intent.payment_failed` - Payment failed

**Note:** This endpoint requires raw body parsing and should be configured in Stripe Dashboard.

---

## 🧪 Testing

### Run Payment Tests

```bash
node test-payment-api.js
```

This will:
1. Get available prices
2. Create a checkout session
3. Get session details
4. Verify payment status
5. Get team payments
6. Test error handling

### Manual Testing

1. **Create a checkout session:**
```bash
curl -X POST http://localhost:3000/api/v1/payments/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"teamId": "test-team-1", "teamName": "Test Team"}'
```

2. **Open the returned URL in your browser**

3. **Use Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

4. **Verify the payment:**
```bash
curl http://localhost:3000/api/v1/payments/verify/SESSION_ID
```

---

## 🔔 Stripe Webhooks

### Setup Webhooks (Local Testing)

1. **Install Stripe CLI:**
```bash
# Mac
brew install stripe/stripe-cli/stripe

# Other platforms: https://stripe.com/docs/stripe-cli
```

2. **Login to Stripe:**
```bash
stripe login
```

3. **Forward webhooks to local server:**
```bash
stripe listen --forward-to localhost:3000/api/v1/payments/webhook
```

4. **Copy the webhook signing secret and add to .env:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

5. **Test a webhook:**
```bash
stripe trigger checkout.session.completed
```

### Setup Webhooks (Production)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/api/v1/payments/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret
6. Add to your environment variables in Vercel/Netlify

---

## 🎨 Frontend Integration

### Example: React/Next.js

```javascript
// Create checkout session and redirect to Stripe
async function handleCheckout() {
  const response = await fetch('http://localhost:3000/api/v1/payments/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teamId: 'team-123',
      teamName: 'My Team',
      successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/cancel`
    })
  });

  const { url } = await response.json();
  
  // Redirect to Stripe Checkout
  window.location.href = url;
}

// Success page - verify payment
async function verifyPayment(sessionId) {
  const response = await fetch(`http://localhost:3000/api/v1/payments/verify/${sessionId}`);
  const data = await response.json();
  
  if (data.verified) {
    console.log('Payment successful!');
    // Update UI, show success message, etc.
  }
}
```

### Example: HTML/JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Team Payment</title>
</head>
<body>
  <h1>Register Team</h1>
  <button id="checkout-button">Pay Now</button>

  <script>
    document.getElementById('checkout-button').addEventListener('click', async () => {
      const response = await fetch('http://localhost:3000/api/v1/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: 'team-' + Date.now(),
          teamName: 'Test Team',
          successUrl: window.location.origin + '/success.html',
          cancelUrl: window.location.origin + '/cancel.html'
        })
      });

      const { url } = await response.json();
      window.location.href = url;
    });
  </script>
</body>
</html>
```

---

## 💳 Testing with Stripe Test Cards

Use these test cards in Stripe Checkout:

### Successful Payments

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Visa - Succeeds |
| `5555 5555 5555 4444` | Mastercard - Succeeds |
| `3782 822463 10005` | American Express - Succeeds |

### Failed Payments

| Card Number | Description |
|------------|-------------|
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Card expired |

**For all test cards:**
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC
- Use any postal code

More test cards: https://stripe.com/docs/testing

---

## 🔒 Security Best Practices

1. **Never expose secret keys in frontend code**
   - Only use public key in frontend
   - Keep secret key in environment variables

2. **Verify webhooks**
   - Always verify webhook signatures
   - Use `STRIPE_WEBHOOK_SECRET`

3. **Validate on server**
   - Never trust client-side payment status
   - Always verify with Stripe API

4. **Use HTTPS in production**
   - Required for Stripe webhooks
   - Secure customer data

5. **Handle errors gracefully**
   - Show user-friendly error messages
   - Log errors for debugging

---

## 📊 Payment Flow Diagram

```
1. User selects team registration
         ↓
2. Frontend calls POST /create-checkout-session
         ↓
3. API creates Stripe Checkout Session
         ↓
4. User redirected to Stripe Checkout
         ↓
5. User enters payment details
         ↓
6. Stripe processes payment
         ↓
7. User redirected to success URL
         ↓
8. Webhook notifies your API (checkout.session.completed)
         ↓
9. API marks team as paid
         ↓
10. Frontend verifies payment with GET /verify/:sessionId
```

---

## 🐛 Troubleshooting

### Issue: "No such price"
**Solution:** Verify the price ID exists in your Stripe dashboard and is in test mode.

### Issue: "Webhook signature verification failed"
**Solution:** 
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/v1/payments/webhook`

### Issue: "Payment not verifying"
**Solution:**
- Check if webhook is configured correctly
- Manually verify using the session ID endpoint
- Check Stripe Dashboard for payment status

### Issue: "CORS errors"
**Solution:** Add your frontend origin to CORS configuration in `api/index.js`

---

## 📚 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)

---

## ✅ Next Steps

1. ✅ Test payment flow with test cards
2. 🔄 Set up webhooks for production
3. 💾 Store payment records in database
4. 📧 Send confirmation emails
5. 🎨 Create custom success/cancel pages
6. 📊 Add payment analytics
7. 🔒 Add additional security measures

Happy coding! 💳🚀
