const express = require('express');
const router = express.Router();

// Exposure Events API configuration
const EXPOSURE_API_KEY = process.env.EXPOSURE_API_KEY || '9bZ9A99u99999M';
const EXPOSURE_SECRET_KEY = process.env.EXPOSURE_SECRET_KEY || 'E99pWXF9emeW6Bs7X659lH9vhr7aPcOE';
const EXPOSURE_BASE_URL = process.env.EXPOSURE_BASE_URL || 'https://basketball.exposureevents.com/api/v1';

// Helper function to make authenticated requests to Exposure Events
async function exposureRequest(endpoint, method = 'GET', body = null) {
  // Try different authentication header formats
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Api-Key': EXPOSURE_API_KEY,
    'X-Secret-Key': EXPOSURE_SECRET_KEY,
    'ApiKey': EXPOSURE_API_KEY,
    'SecretKey': EXPOSURE_SECRET_KEY,
    'api-key': EXPOSURE_API_KEY,
    'secret-key': EXPOSURE_SECRET_KEY
  };

  const options = {
    method,
    headers
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${EXPOSURE_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Exposure API Error Response:', errorText);
      throw new Error(`Exposure API Error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('Exposure API Request Error:', error);
    throw error;
  }
}

/**
 * @swagger
 * /api/v1/exposure/test-auth:
 *   get:
 *     summary: Test Exposure Events authentication
 *     description: Test endpoint to verify API keys are working
 *     tags: [Exposure Integration]
 *     responses:
 *       200:
 *         description: Authentication test results
 */
router.get('/test-auth', async (req, res) => {
  try {
    // Check if keys are configured
    const keysConfigured = {
      apiKey: EXPOSURE_API_KEY ? 'Set' : 'Not Set',
      secretKey: EXPOSURE_SECRET_KEY ? 'Set' : 'Not Set',
      baseUrl: EXPOSURE_BASE_URL
    };

    // Try a simple request to test authentication
    try {
      const testResponse = await exposureRequest('/events?pageSize=1');
      res.json({
        status: 'Authentication successful',
        keys: keysConfigured,
        testRequest: 'Success',
        sampleData: testResponse
      });
    } catch (error) {
      res.json({
        status: 'Authentication failed',
        keys: keysConfigured,
        error: error.message
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/exposure/events:
 *   get:
 *     summary: Get events from Exposure Events
 *     description: Retrieve all events from Exposure Events platform
 *     tags: [Exposure Integration]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       500:
 *         description: Error fetching events
 */
router.get('/events', async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    let endpoint = '/events';
    
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (pageSize) params.append('pageSize', pageSize);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await exposureRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/exposure/events/{eventId}:
 *   get:
 *     summary: Get single event details
 *     description: Retrieve details for a specific event
 *     tags: [Exposure Integration]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details retrieved
 *       500:
 *         description: Error fetching event
 */
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const data = await exposureRequest(`/events/${eventId}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch event',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/exposure/divisions:
 *   get:
 *     summary: Get divisions
 *     description: Retrieve all divisions from Exposure Events
 *     tags: [Exposure Integration]
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: integer
 *         description: Filter by event ID
 *     responses:
 *       200:
 *         description: Divisions retrieved successfully
 *       500:
 *         description: Error fetching divisions
 */
router.get('/divisions', async (req, res) => {
  try {
    const { eventId } = req.query;
    let endpoint = '/divisions';
    
    if (eventId) {
      endpoint += `?eventId=${eventId}`;
    }

    const data = await exposureRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch divisions',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/exposure/teams:
 *   get:
 *     summary: Get teams from Exposure Events
 *     description: Retrieve all teams from Exposure Events platform
 *     tags: [Exposure Integration]
 *     parameters:
 *       - in: query
 *         name: divisionId
 *         schema:
 *           type: integer
 *         description: Filter by division ID
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: integer
 *         description: Filter by event ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 *       500:
 *         description: Error fetching teams
 */
router.get('/teams', async (req, res) => {
  try {
    const { divisionId, eventId, page, pageSize } = req.query;
    let endpoint = '/teams';
    
    const params = new URLSearchParams();
    if (divisionId) params.append('divisionId', divisionId);
    if (eventId) params.append('eventId', eventId);
    if (page) params.append('page', page);
    if (pageSize) params.append('pageSize', pageSize);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await exposureRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch teams',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/exposure/teams/{teamId}:
 *   get:
 *     summary: Get single team details
 *     description: Retrieve details for a specific team
 *     tags: [Exposure Integration]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details retrieved
 *       500:
 *         description: Error fetching team
 */
router.get('/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const data = await exposureRequest(`/teams/${teamId}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch team',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/exposure/teams:
 *   post:
 *     summary: Create team in Exposure Events
 *     description: Register a new team in the Exposure Events platform
 *     tags: [Exposure Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - DivisionId
 *               - Name
 *             properties:
 *               DivisionId:
 *                 type: integer
 *                 example: 1000
 *               Name:
 *                 type: string
 *                 example: Team Exposure
 *               Gender:
 *                 type: integer
 *                 example: 2
 *               Paid:
 *                 type: boolean
 *                 example: true
 *               Status:
 *                 type: integer
 *                 example: 1
 *               Address:
 *                 type: object
 *                 properties:
 *                   City:
 *                     type: string
 *                   StateRegion:
 *                     type: string
 *                   PostalCode:
 *                     type: string
 *               Players:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ExternalPlayerId:
 *                       type: string
 *                     FirstName:
 *                       type: string
 *                     LastName:
 *                       type: string
 *                     Number:
 *                       type: string
 *               Notes:
 *                 type: string
 *               Website:
 *                 type: string
 *               TwitterHandle:
 *                 type: string
 *               Abbreviation:
 *                 type: string
 *               ExternalTeamId:
 *                 type: string
 *               InstagramHandle:
 *                 type: string
 *               FacebookPage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Team created successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Error creating team
 */
router.post('/teams', async (req, res) => {
  try {
    // Transform frontend data to Exposure Events format
    const teamData = {
      DivisionId: req.body.divisionId || req.body.DivisionId,
      Name: req.body.name || req.body.Name,
      Gender: req.body.gender || req.body.Gender,
      Paid: req.body.paid || req.body.Paid || false,
      Status: req.body.status || req.body.Status || 1,
      Address: req.body.address || req.body.Address,
      Players: req.body.players || req.body.Players || [],
      Notes: req.body.notes || req.body.Notes || '',
      Website: req.body.website || req.body.Website || '',
      TwitterHandle: req.body.twitterHandle || req.body.TwitterHandle || '',
      Abbreviation: req.body.abbreviation || req.body.Abbreviation || '',
      ExternalTeamId: req.body.externalTeamId || req.body.ExternalTeamId || '',
      InstagramHandle: req.body.instagramHandle || req.body.InstagramHandle || '',
      FacebookPage: req.body.facebookPage || req.body.FacebookPage || ''
    };

    const data = await exposureRequest('/teams', 'POST', teamData);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create team',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/exposure/teams/{teamId}:
 *   put:
 *     summary: Update team in Exposure Events
 *     description: Update an existing team in Exposure Events platform
 *     tags: [Exposure Integration]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Name:
 *                 type: string
 *               Gender:
 *                 type: integer
 *               Paid:
 *                 type: boolean
 *               Status:
 *                 type: integer
 *               Address:
 *                 type: object
 *               Players:
 *                 type: array
 *               Notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Team updated successfully
 *       404:
 *         description: Team not found
 *       500:
 *         description: Error updating team
 */
router.put('/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Transform frontend data to Exposure Events format
    const updateData = {};
    
    if (req.body.name || req.body.Name) updateData.Name = req.body.name || req.body.Name;
    if (req.body.gender !== undefined || req.body.Gender !== undefined) {
      updateData.Gender = req.body.gender || req.body.Gender;
    }
    if (req.body.paid !== undefined || req.body.Paid !== undefined) {
      updateData.Paid = req.body.paid || req.body.Paid;
    }
    if (req.body.status !== undefined || req.body.Status !== undefined) {
      updateData.Status = req.body.status || req.body.Status;
    }
    if (req.body.address || req.body.Address) updateData.Address = req.body.address || req.body.Address;
    if (req.body.players || req.body.Players) updateData.Players = req.body.players || req.body.Players;
    if (req.body.notes !== undefined || req.body.Notes !== undefined) {
      updateData.Notes = req.body.notes || req.body.Notes;
    }
    if (req.body.website || req.body.Website) updateData.Website = req.body.website || req.body.Website;
    if (req.body.twitterHandle || req.body.TwitterHandle) {
      updateData.TwitterHandle = req.body.twitterHandle || req.body.TwitterHandle;
    }
    if (req.body.abbreviation || req.body.Abbreviation) {
      updateData.Abbreviation = req.body.abbreviation || req.body.Abbreviation;
    }

    const data = await exposureRequest(`/teams/${teamId}`, 'PUT', updateData);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update team',
      message: error.message
    });
  }
});

module.exports = router;