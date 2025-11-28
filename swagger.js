const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Teams API with Stripe Payments',
      version: '1.0.0',
      description: 'Complete REST API for managing teams with integrated Stripe payment processing',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://teams-api.vercel.app',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Teams',
        description: 'Team management endpoints (local)'
      },
      {
        name: 'Payments',
        description: 'Stripe payment processing endpoints'
      },
      {
        name: 'Exposure Integration',
        description: 'Exposure Events platform integration endpoints'
      },
      {
        name: 'Health',
        description: 'API health check'
      }
    ],
    components: {
      schemas: {
        Team: {
          type: 'object',
          required: ['divisionId', 'name'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique team identifier (UUID)',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            divisionId: {
              type: 'integer',
              description: 'Division ID the team belongs to',
              example: 1000
            },
            name: {
              type: 'string',
              description: 'Team name',
              example: 'Team Exposure'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Team contact email for registration confirmation',
              example: 'coach@teamexposure.com'
            },
            gender: {
              type: 'integer',
              description: 'Gender identifier (1=Male, 2=Female)',
              example: 2
            },
            paid: {
              type: 'boolean',
              description: 'Payment status',
              example: true
            },
            status: {
              type: 'integer',
              description: 'Team status (1=Active)',
              example: 1
            },
            address: {
              type: 'object',
              properties: {
                city: { type: 'string', example: 'Louisville' },
                stateRegion: { type: 'string', example: 'KY' },
                postalCode: { type: 'string', example: '40205' }
              }
            },
            players: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  externalPlayerId: { type: 'string', example: 'P1' },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  email: { type: 'string', format: 'email', example: 'john.doe@example.com', description: 'Player email for registration confirmation' },
                  number: { type: 'string', example: '23' }
                }
              }
            },
            notes: {
              type: 'string',
              example: 'Team notes'
            },
            website: {
              type: 'string',
              example: 'https://example.com'
            },
            twitterHandle: {
              type: 'string',
              example: 'teamhandle'
            },
            abbreviation: {
              type: 'string',
              example: 'TE'
            },
            externalTeamId: {
              type: 'string',
              example: 'EXT123'
            },
            instagramHandle: {
              type: 'string',
              example: 'teamhandle'
            },
            facebookPage: {
              type: 'string',
              example: 'http://facebook.com/team'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CheckoutSession: {
          type: 'object',
          required: ['teamId'],
          properties: {
            teamId: {
              type: 'string',
              description: 'Unique team identifier',
              example: 'team-123'
            },
            teamName: {
              type: 'string',
              description: 'Team name',
              example: 'Team Exposure'
            },
            priceId: {
              type: 'string',
              description: 'Stripe Price ID',
              example: 'price_1SQOyhPIlfT968CUdrbeDRTm'
            },
            quantity: {
              type: 'integer',
              description: 'Quantity to purchase',
              example: 1
            },
            successUrl: {
              type: 'string',
              description: 'URL to redirect after successful payment',
              example: 'https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}'
            },
            cancelUrl: {
              type: 'string',
              description: 'URL to redirect if payment is cancelled',
              example: 'https://yourdomain.com/cancel'
            }
          }
        },
        PaymentSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cs_test_a1b2c3d4'
            },
            teamId: {
              type: 'string',
              example: 'team-123'
            },
            teamName: {
              type: 'string',
              example: 'Team Exposure'
            },
            status: {
              type: 'string',
              enum: ['pending', 'paid', 'unpaid'],
              example: 'paid'
            },
            amount: {
              type: 'integer',
              description: 'Amount in cents',
              example: 5000
            },
            currency: {
              type: 'string',
              example: 'usd'
            },
            paymentIntent: {
              type: 'string',
              example: 'pi_test_1234567890'
            },
            customerEmail: {
              type: 'string',
              example: 'customer@example.com'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Bad Request'
            },
            message: {
              type: 'string',
              example: 'teamId is required'
            }
          }
        }
      }
    }
  },
  apis: ['./api/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;