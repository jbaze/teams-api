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
 *     description: Create a new Stripe Checkout session for team registration, player camp, or player metrics payment. Either teamId or playerId is required. Use paymentType to automatically select the correct price.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamId:
 *                 type: string
 *                 description: Team ID (required for team payments)
 *               teamName:
 *                 type: string
 *                 description: Team name
 *               playerId:
 *                 type: string
 *                 description: Player ID (required for player payments)
 *               playerFirstName:
 *                 type: string
 *                 description: Player first name
 *               playerLastName:
 *                 type: string
 *                 description: Player last name
 *               paymentType:
 *                 type: string
 *                 enum: [team, camp, metrics]
 *                 description: Payment type - automatically selects correct price ID
 *               priceId:
 *                 type: string
 *                 description: Stripe price ID (optional - overrides paymentType)
 *               quantity:
 *                 type: integer
 *                 default: 1
 *               successUrl:
 *                 type: string
 *               cancelUrl:
 *                 type: string
 *           examples:
 *             teamU12Payment:
 *               summary: Team Registration
 *               value:
 *                 teamId: team-123
 *                 teamName: Team Exposure
 *                 paymentType: team
 *                 quantity: 1
 *                 successUrl: https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}
 *                 cancelUrl: https://yourdomain.com/cancel
 *             teamPayment:
 *               summary: Team Registration
 *               value:
 *                 teamId: team-123
 *                 teamName: Team Exposure
 *                 paymentType: team
 *                 quantity: 1
 *                 successUrl: https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}
 *                 cancelUrl: https://yourdomain.com/cancel
 *             playerCampPayment:
 *               summary: Player Camp Registration
 *               value:
 *                 playerId: player-456
 *                 playerFirstName: John
 *                 playerLastName: Doe
 *                 teamId: team-123
 *                 teamName: Team Exposure
 *                 paymentType: camp
 *                 quantity: 1
 *                 successUrl: https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}
 *                 cancelUrl: https://yourdomain.com/cancel
 *             playerMetricsPayment:
 *               summary: Player Metrics Payment
 *               value:
 *                 playerId: player-456
 *                 playerFirstName: John
 *                 playerLastName: Doe
 *                 teamId: team-123
 *                 teamName: Team Exposure
 *                 paymentType: metrics
 *                 quantity: 1
 *                 successUrl: https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}
 *                 cancelUrl: https://yourdomain.com/cancel
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
 *                 teamId:
 *                   type: string
 *                   description: Team ID (if team payment)
 *                 teamName:
 *                   type: string
 *                   description: Team name (if team payment)
 *                 playerId:
 *                   type: string
 *                   description: Player ID (if player payment)
 *                 playerFirstName:
 *                   type: string
 *                   description: Player first name (if player payment)
 *                 playerLastName:
 *                   type: string
 *                   description: Player last name (if player payment)
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
 * Create a Stripe checkout session for team registration, player camp, or player metrics payment
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      teamId, // Always optional - can be provided for player payments too
      teamName, // Always optional - can be provided for player payments too
      playerId,
      playerFirstName,
      playerLastName,
      paymentType, // 'team', 'team-u12', 'camp', or 'metrics'
      priceId, // Optional: override automatic price selection
      quantity = 1,
      successUrl,
      cancelUrl
    } = req.body;

    // Validation - either teamId or playerId is required
    if (!teamId && !playerId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Either teamId or playerId is required'
      });
    }

    // Determine price ID based on paymentType if not explicitly provided
    let finalPriceId = priceId;
    if (!finalPriceId && paymentType) {
      switch (paymentType.toLowerCase()) {
        case 'team':
          finalPriceId = process.env.STRIPE_PRICE_TEAM;
          break;
        case 'camp':
          finalPriceId = process.env.STRIPE_PRICE_PLAYER_CAMP;
          break;
        case 'metrics':
          finalPriceId = process.env.STRIPE_PRICE_PLAYER_METRICS;
          break;
        case 'team-u12':
          finalPriceId = process.env.STRIPE_PRICE_TEAM_U12;
          break;
        default:
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid paymentType. Must be "team", "team-u12", "camp", or "metrics"'
          });
      }
    }

    // Default to team price if still not set
    if (!finalPriceId) {
      finalPriceId = process.env.STRIPE_PRICE_TEAM;
    }

    // Build metadata based on payment type
    const metadata = {};
    // Always include team info if provided (even for player payments)
    if (teamId) {
      metadata.teamId = teamId;
      metadata.teamName = teamName || '';
    }
    // Include player info if provided
    if (playerId) {
      metadata.playerId = playerId;
      metadata.playerFirstName = playerFirstName || '';
      metadata.playerLastName = playerLastName || '';
    }
    if (paymentType) {
      metadata.paymentType = paymentType;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin || 'http://localhost:3000'}/cancel`,
      metadata: metadata,
      client_reference_id: teamId || playerId,
    });

    // Store session info
    const sessionData = {
      sessionId: session.id,
      amount: session.amount_total,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Add team info if provided (even for player payments)
    if (teamId) {
      sessionData.teamId = teamId;
      sessionData.teamName = teamName;
    }
    // Add player info if provided
    if (playerId) {
      sessionData.playerId = playerId;
      sessionData.playerFirstName = playerFirstName;
      sessionData.playerLastName = playerLastName;
    }
    if (paymentType) {
      sessionData.paymentType = paymentType;
    }

    paymentSessions.push(sessionData);

    // Build response
    const response = {
      sessionId: session.id,
      url: session.url,
      publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_51SPufqPIlfT968CUHp8ZnkqkWGIz2rNsscwJnCHAuRrIuiId3JBVxXYMDUaaUcGBh23aWT3swsxdz8OeSXBPzxgz00lVq6kOw8'
    };

    // Include team info in response if provided
    if (teamId) {
      response.teamId = teamId;
      response.teamName = teamName;
    }
    // Include player info in response if provided
    if (playerId) {
      response.playerId = playerId;
      response.playerFirstName = playerFirstName;
      response.playerLastName = playerLastName;
    }
    if (paymentType) {
      response.paymentType = paymentType;
    }

    res.status(200).json(response);
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

    const responseData = {
      session: {
        id: session.id,
        status: session.payment_status,
        amount: session.amount_total,
        currency: session.currency,
        paymentIntent: session.payment_intent,
        customerEmail: session.customer_details?.email,
        createdAt: new Date(session.created * 1000).toISOString()
      }
    };

    // Add team info if present
    if (session.metadata?.teamId || localSession?.teamId) {
      responseData.session.teamId = session.metadata?.teamId || localSession?.teamId;
      responseData.session.teamName = session.metadata?.teamName || localSession?.teamName;
    }

    // Add player info if present
    if (session.metadata?.playerId || localSession?.playerId) {
      responseData.session.playerId = session.metadata?.playerId || localSession?.playerId;
      responseData.session.playerFirstName = session.metadata?.playerFirstName || localSession?.playerFirstName;
      responseData.session.playerLastName = session.metadata?.playerLastName || localSession?.playerLastName;
    }

    res.status(200).json(responseData);
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

      const responseData = {
        verified: true,
        status: 'paid',
        amount: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_details?.email
      };

      // Add team info if present
      if (session.metadata?.teamId) {
        responseData.teamId = session.metadata.teamId;
        responseData.teamName = session.metadata.teamName;
      }

      // Add player info if present
      if (session.metadata?.playerId) {
        responseData.playerId = session.metadata.playerId;
        responseData.playerFirstName = session.metadata.playerFirstName;
        responseData.playerLastName = session.metadata.playerLastName;
      }

      res.status(200).json(responseData);
    } else {
      const responseData = {
        verified: false,
        status: session.payment_status
      };

      // Add team/player info if present
      if (session.metadata?.teamId) {
        responseData.teamId = session.metadata.teamId;
      }
      if (session.metadata?.playerId) {
        responseData.playerId = session.metadata.playerId;
      }

      res.status(200).json(responseData);
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
    // Return all available price IDs
    res.status(200).json({
      prices: [
        {
          id: process.env.STRIPE_PRICE_TEAM || 'price_1SQOyhPIlfT968CUdrbeDRTm',
          productName: 'Team Registration',
          currency: 'usd',
          type: 'one_time'
        },
        {
          id: process.env.STRIPE_PRICE_PLAYER_CAMP || 'price_player_camp',
          productName: 'Player Camp Registration',
          currency: 'usd',
          type: 'one_time'
        },
        {
          id: process.env.STRIPE_PRICE_PLAYER_METRICS || 'price_player_metrics',
          productName: 'Player Metrics',
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
