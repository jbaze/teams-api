const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');
const paymentRoutes = require('./payments');

const app = express();

// Middleware
app.use(cors());

// Special handling for Stripe webhook (needs raw body)
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

// JSON middleware for all other routes
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Teams API Documentation'
}));

// In-memory data store (in production, use a real database)
let teams = [];

// Helper function to find team by ID
const findTeamById = (id) => teams.find(team => team.id === id);

/**
 * @swagger
 * /api/v1/teams:
 *   get:
 *     summary: Retrieve teams
 *     description: Get all teams or a single team by ID. Supports pagination and filtering by division.
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Specific team ID to retrieve
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *       - in: query
 *         name: divisionId
 *         schema:
 *           type: integer
 *         description: Filter teams by division ID
 *         example: 1000
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Successfully retrieved team(s)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *                 - type: object
 *                   properties:
 *                     teams:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         totalResults:
 *                           type: integer
 *                         results:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/teams - Retrieve all teams or a single team by ID
app.get('/api/v1/teams', (req, res) => {
  try {
    const { id, divisionId, page = 1, pageSize = 50 } = req.query;

    // Get single team by ID
    if (id) {
      const team = findTeamById(id);
      if (!team) {
        return res.status(404).json({
          error: 'Team not found',
          message: `No team found with ID: ${id}`
        });
      }
      return res.status(200).json({ team });
    }

    // Filter by division if provided
    let filteredTeams = teams;
    if (divisionId) {
      filteredTeams = teams.filter(team => team.divisionId === parseInt(divisionId));
    }

    // Pagination
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

    res.status(200).json({
      teams: {
        page: pageNum,
        pageSize: pageSizeNum,
        totalResults: filteredTeams.length,
        results: paginatedTeams
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/teams:
 *   post:
 *     summary: Create a new team
 *     description: Register a new team with complete details including players, address, and social media.
 *     tags: [Teams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - divisionId
 *               - name
 *             properties:
 *               divisionId:
 *                 type: integer
 *                 example: 1000
 *               name:
 *                 type: string
 *                 example: Team Exposure
 *               gender:
 *                 type: integer
 *                 example: 2
 *               paid:
 *                 type: boolean
 *                 example: true
 *               status:
 *                 type: integer
 *                 example: 1
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   stateRegion:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *               players:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     externalPlayerId:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     number:
 *                       type: string
 *               notes:
 *                 type: string
 *               website:
 *                 type: string
 *               twitterHandle:
 *                 type: string
 *               abbreviation:
 *                 type: string
 *               externalTeamId:
 *                 type: string
 *               instagramHandle:
 *                 type: string
 *               facebookPage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
// POST /api/v1/teams - Create a new team
app.post('/api/v1/teams', (req, res) => {
  try {
    const {
      divisionId,
      name,
      gender,
      paid = false,
      status = 1,
      address,
      players = [],
      notes,
      website,
      twitterHandle,
      abbreviation,
      externalTeamId,
      instagramHandle,
      facebookPage
    } = req.body;

    // Validation
    if (!divisionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'divisionId is required'
      });
    }

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name is required'
      });
    }

    // Create new team
    const newTeam = {
      id: uuidv4(),
      divisionId: parseInt(divisionId),
      name,
      gender: gender || null,
      paid: Boolean(paid),
      status: parseInt(status) || 1,
      address: address || {},
      players: players || [],
      notes: notes || '',
      website: website || '',
      twitterHandle: twitterHandle || '',
      abbreviation: abbreviation || '',
      externalTeamId: externalTeamId || '',
      instagramHandle: instagramHandle || '',
      facebookPage: facebookPage || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    teams.push(newTeam);

    res.status(201).json({
      message: 'Team created successfully',
      team: newTeam
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/teams:
 *   put:
 *     summary: Update an existing team
 *     description: Update team details. Only provided fields will be updated (partial update).
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID to update
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               divisionId:
 *                 type: integer
 *               name:
 *                 type: string
 *               gender:
 *                 type: integer
 *               paid:
 *                 type: boolean
 *               status:
 *                 type: integer
 *               address:
 *                 type: object
 *               players:
 *                 type: array
 *               notes:
 *                 type: string
 *               website:
 *                 type: string
 *               twitterHandle:
 *                 type: string
 *               abbreviation:
 *                 type: string
 *               externalTeamId:
 *                 type: string
 *               instagramHandle:
 *                 type: string
 *               facebookPage:
 *                 type: string
 *           example:
 *             name: Updated Team Name
 *             paid: true
 *             notes: Updated team information
 *     responses:
 *       200:
 *         description: Team updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         description: Bad request - missing team ID
 *       404:
 *         description: Team not found
 *       500:
 *         description: Internal server error
 */
// PUT /api/v1/teams - Update an existing team
app.put('/api/v1/teams', (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Team ID is required in query parameters'
      });
    }

    const teamIndex = teams.findIndex(team => team.id === id);

    if (teamIndex === -1) {
      return res.status(404).json({
        error: 'Team not found',
        message: `No team found with ID: ${id}`
      });
    }

    // Get the existing team
    const existingTeam = teams[teamIndex];

    // Update only the fields that are provided in the request
    const updatedTeam = {
      ...existingTeam,
      ...(req.body.divisionId && { divisionId: parseInt(req.body.divisionId) }),
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.gender !== undefined && { gender: req.body.gender }),
      ...(req.body.paid !== undefined && { paid: Boolean(req.body.paid) }),
      ...(req.body.status !== undefined && { status: parseInt(req.body.status) }),
      ...(req.body.address && { address: { ...existingTeam.address, ...req.body.address } }),
      ...(req.body.players && { players: req.body.players }),
      ...(req.body.notes !== undefined && { notes: req.body.notes }),
      ...(req.body.website !== undefined && { website: req.body.website }),
      ...(req.body.twitterHandle !== undefined && { twitterHandle: req.body.twitterHandle }),
      ...(req.body.abbreviation !== undefined && { abbreviation: req.body.abbreviation }),
      ...(req.body.externalTeamId !== undefined && { externalTeamId: req.body.externalTeamId }),
      ...(req.body.instagramHandle !== undefined && { instagramHandle: req.body.instagramHandle }),
      ...(req.body.facebookPage !== undefined && { facebookPage: req.body.facebookPage }),
      updatedAt: new Date().toISOString()
    };

    teams[teamIndex] = updatedTeam;

    res.status(200).json({
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running and get basic statistics.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 teamsCount:
 *                   type: integer
 *                   example: 5
 */
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    teamsCount: teams.length
  });
});

// Payment routes
app.use('/api/v1/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Export for Vercel serverless
module.exports = app;