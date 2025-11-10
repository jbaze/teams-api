const express = require('express');
const Stripe = require('stripe');

const router = express.Router();

// Initialize Stripe with secret key from environment variable
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Store payment sessions in memory (use database in production)
let paymentSessions = [];

/**
 * @swagger
 * /api/v1/payments/create-checkout-session:
 *   post:
 *     summary: Create Stripe checkout session
 *     description: Create a new Stripe Checkout session for team registration payment.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutSession'
 *           example:
 *             teamId: team-123
 *             teamName: Team Exposure
 *             priceId: price_1SQOyhPIlfT968CUdrbeDRTm
 *             quantity: 1
 *             successUrl: https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}
 *             cancelUrl: https://yourdomain.com/cancel
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: Stripe session ID
 *                   example: cs_test_a1b2c3d4e5f6g7h8i9j0
 *                 url:
 *                   type: string
 *                   description: Stripe Checkout URL to redirect user to
 *                   example: https://checkout.stripe.com/pay/cs_test_...
 *                 publicKey:
 *                   type: string
 *                   description: Stripe public key for frontend
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Payment error
 */
/**
 * POST /api/v1/payments/create-checkout-session
 * Create a Stripe checkout session for team registration payment
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      teamId,
      teamName,
      priceId = 'price_1SQOyhPIlfT968CUdrbeDRTm', // Default price ID
      quantity = 1,
      successUrl,
      cancelUrl
    } = req.body;

    // Validation
    if (!teamId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'teamId is required'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin || 'http://localhost:3000'}/cancel`,
      metadata: {
        teamId: teamId,
        teamName: teamName || 'Unknown Team'
      },
      client_reference_id: teamId,
    });

    // Store session info
    paymentSessions.push({
      sessionId: session.id,
      teamId: teamId,
      teamName: teamName,
      amount: session.amount_total,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
      publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_51SPufqPIlfT968CUHp8ZnkqkWGIz2rNsscwJnCHAuRrIuiId3JBVxXYMDUaaUcGBh23aWT3swsxdz8OeSXBPzxgz00lVq6kOw8'
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({
      error: 'Payment error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/payments/session/{sessionId}:
 *   get:
 *     summary: Get payment session details
 *     description: Retrieve complete details of a payment session from Stripe.
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe session ID
 *         example: cs_test_a1b2c3d4e5f6g7h8i9j0
 *     responses:
 *       200:
 *         description: Session details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   $ref: '#/components/schemas/PaymentSession'
 *       500:
 *         description: Error retrieving session
 */
/**
 * GET /api/v1/payments/session/:sessionId
 * Retrieve payment session details
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Find local session data
    const localSession = paymentSessions.find(s => s.sessionId === sessionId);

    res.status(200).json({
      session: {
        id: session.id,
        teamId: session.metadata?.teamId || localSession?.teamId,
        teamName: session.metadata?.teamName || localSession?.teamName,
        status: session.payment_status,
        amount: session.amount_total,
        currency: session.currency,
        paymentIntent: session.payment_intent,
        customerEmail: session.customer_details?.email,
        createdAt: new Date(session.created * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({
      error: 'Error retrieving session',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/payments/verify/{sessionId}:
 *   get:
 *     summary: Verify payment status
 *     description: Check if a payment has been completed successfully.
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe session ID to verify
 *         example: cs_test_a1b2c3d4e5f6g7h8i9j0
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                   description: Whether payment is verified as paid
 *                   example: true
 *                 status:
 *                   type: string
 *                   description: Payment status
 *                   example: paid
 *                 teamId:
 *                   type: string
 *                   example: team-123
 *                 amount:
 *                   type: integer
 *                   description: Amount in cents
 *                   example: 5000
 *                 currency:
 *                   type: string
 *                   example: usd
 *                 customerEmail:
 *                   type: string
 *                   example: customer@example.com
 *       500:
 *         description: Verification error
 */
/**
 * GET /api/v1/payments/verify/:sessionId
 * Verify payment status
 */
router.get('/verify/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Update local session
      const localSessionIndex = paymentSessions.findIndex(s => s.sessionId === sessionId);
      if (localSessionIndex !== -1) {
        paymentSessions[localSessionIndex].status = 'paid';
        paymentSessions[localSessionIndex].paidAt = new Date().toISOString();
      }

      res.status(200).json({
        verified: true,
        status: 'paid',
        teamId: session.metadata?.teamId,
        amount: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_details?.email
      });
    } else {
      res.status(200).json({
        verified: false,
        status: session.payment_status,
        teamId: session.metadata?.teamId
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: 'Verification error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/payments/team/{teamId}:
 *   get:
 *     summary: Get team payment history
 *     description: Retrieve all payment sessions for a specific team.
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *         example: team-123
 *     responses:
 *       200:
 *         description: Team payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teamId:
 *                   type: string
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sessionId:
 *                         type: string
 *                       teamId:
 *                         type: string
 *                       teamName:
 *                         type: string
 *                       amount:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       paidAt:
 *                         type: string
 *                 totalPayments:
 *                   type: integer
 *                 paidPayments:
 *                   type: integer
 *       500:
 *         description: Error retrieving payments
 */
/**
 * GET /api/v1/payments/team/:teamId
 * Get all payment sessions for a team
 */
router.get('/team/:teamId', (req, res) => {
  try {
    const { teamId } = req.params;

    const teamPayments = paymentSessions.filter(s => s.teamId === teamId);

    res.status(200).json({
      teamId: teamId,
      payments: teamPayments,
      totalPayments: teamPayments.length,
      paidPayments: teamPayments.filter(p => p.status === 'paid').length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error retrieving payments',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/payments/webhook
 * Stripe webhook endpoint for payment events
 * Important: This needs raw body, so we exclude it from express.json() middleware
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For testing without webhook secret
      event = JSON.parse(req.body.toString());
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Payment successful:', session.id);

        // Update payment status
        const sessionIndex = paymentSessions.findIndex(s => s.sessionId === session.id);
        if (sessionIndex !== -1) {
          paymentSessions[sessionIndex].status = 'paid';
          paymentSessions[sessionIndex].paidAt = new Date().toISOString();
        }

        // Here you would typically:
        // 1. Mark team as paid in database
        // 2. Send confirmation email
        // 3. Grant access to event
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * @swagger
 * /api/v1/payments/prices:
 *   get:
 *     summary: Get available prices
 *     description: Retrieve list of available products and prices.
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Prices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: price_1SQOyhPIlfT968CUdrbeDRTm
 *                       productName:
 *                         type: string
 *                         example: Team Registration
 *                       currency:
 *                         type: string
 *                         example: usd
 *                       type:
 *                         type: string
 *                         example: one_time
 *       500:
 *         description: Error retrieving prices
 */
/**
 * GET /api/v1/payments/prices
 * Get available prices/products
 */
router.get('/prices', async (req, res) => {
  try {
    // In production, you'd fetch this from Stripe
    // For now, return the configured price
    res.status(200).json({
      prices: [
        {
          id: 'price_1SQOyhPIlfT968CUdrbeDRTm',
          productName: 'Team Registration',
          currency: 'usd',
          type: 'one_time'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error retrieving prices',
      message: error.message
    });
  }
});

module.exports = router;
