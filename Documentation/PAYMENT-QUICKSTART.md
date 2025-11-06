# 🚀 Quick Start - Payment Integration

## ✅ What's Included

Your Teams API now has complete Stripe payment integration with:

- ✅ **6 Payment Endpoints** - Create sessions, verify payments, get payment history
- ✅ **Stripe Webhook Support** - Real-time payment notifications
- ✅ **Test Environment** - Pre-configured with your Stripe test keys
- ✅ **HTML Examples** - Ready-to-use payment pages
- ✅ **Automated Tests** - Verify everything works

## 🎯 Your Stripe Configuration

```
Price ID: price_1SQOyhPIlfT968CUdrbeDRTm
Public Key: pk_test_51SPufq...
Secret Key: sk_test_51SPufq...
```

**These are already configured in your `.env` file!**

## 🏃 Quick Test (2 minutes)

### Step 1: Install and Start
```bash
npm install
npm run dev
```

### Step 2: Test Payments
```bash
node test-payment-api.js
```

This will:
1. Create a checkout session
2. Give you a Stripe Checkout URL
3. Test all payment endpoints

### Step 3: Complete a Test Payment

1. Open the checkout URL from the test
2. Use test card: `4242 4242 4242 4242`
3. Expiry: `12/34` | CVC: `123`
4. Complete the payment

### Step 4: Try the HTML Example

1. Open `examples/payment-page.html` in your browser
2. Enter team details
3. Click "Proceed to Payment"
4. Complete payment with test card
5. See success page

## 📚 Documentation

- **PAYMENT-API.md** - Complete payment API documentation
- **README.md** - Main API documentation (updated with payments)
- **examples/** - Working HTML payment pages

## 🔑 Payment Endpoints

```
POST /api/v1/payments/create-checkout-session
GET  /api/v1/payments/session/:sessionId
GET  /api/v1/payments/verify/:sessionId
GET  /api/v1/payments/team/:teamId
GET  /api/v1/payments/prices
POST /api/v1/payments/webhook
```

## 💻 Frontend Integration Example

```javascript
// Create checkout session
const response = await fetch('http://localhost:3000/api/v1/payments/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teamId: 'team-123',
    teamName: 'My Team'
  })
});

const { url } = await response.json();

// Redirect to Stripe Checkout
window.location.href = url;
```

## 🧪 Stripe Test Cards

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Exp: Any future date
- CVC: Any 3 digits

**Failed Payment:**
- Card: `4000 0000 0000 0002` (Declined)

More test cards: https://stripe.com/docs/testing

## 🔔 Webhook Setup (Optional)

For local testing with webhooks:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/v1/payments/webhook
```

## 🚀 Deploy to Production

### Vercel
```bash
vercel --prod
```

### Add Environment Variables in Vercel Dashboard:
```
STRIPE_PUBLIC_KEY=pk_test_51SPufq...
STRIPE_SECRET_KEY=sk_test_51SPufq...
STRIPE_PRICE_ID=price_1SQOyhPIlfT968CUdrbeDRTm
```

## 📖 Full Documentation

See **PAYMENT-API.md** for:
- Complete endpoint reference
- Webhook configuration
- Frontend integration examples
- Security best practices
- Troubleshooting

## ✨ What's Next?

1. ✅ Test locally with `node test-payment-api.js`
2. ✅ Try the HTML payment page
3. 🔄 Set up webhooks for production
4. 📧 Add email confirmations
5. 💾 Store payments in database
6. 🎨 Customize success/cancel pages

## 🆘 Need Help?

- Payment API Docs: `PAYMENT-API.md`
- Teams API Docs: `README.md`
- Deployment Guide: `DEPLOYMENT.md`
- Stripe Docs: https://stripe.com/docs

**You're all set! Start testing your payment integration now! 💳🚀**
