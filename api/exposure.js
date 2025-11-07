const express = require('express');
const crypto = require('crypto');
const authManager = require('./auth-manager');
const router = express.Router();

// Exposure Events API configuration
const EXPOSURE_BASE_URL = process.env.EXPOSURE_BASE_URL || 'https://baseball.exposureevents.com/api/v1';

// Helper function to create HMAC-SHA256 signature
function createSignature(apiKey, httpVerb, timestamp, relativeUri, secretKey) {
  // Create message: {API KEY}&{HTTP VERB}&{TIMESTAMP}&{RELATIVE URI}
  // All parameters must be UPPERCASE
  const message = `${apiKey}&${httpVerb}&${timestamp}&${relativeUri}`.toUpperCase();
  
  // Create HMAC-SHA256 hash with secret key
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  
  // Base64 encode the hash
  const signature = hmac.digest('base64');
  
  return signature;
}

// Helper function to make authenticated requests to Exposure Events
async function exposureRequest(endpoint, method = 'GET', body = null) {
  // Check if authenticated
  if (!authManager.isReady()) {
    throw new Error('Not authenticated. Please authenticate first using the /authenticate endpoint.');
  }

  // Get API keys from auth manager
  const EXPOSURE_API_KEY = authManager.getApiKey();
  const EXPOSURE_SECRET_KEY = authManager.getApiSecretKey();

  // Generate ISO 8601 timestamp with 7 decimal places (as per Exposure Events requirement)
  // Example: 2012-09-27T20:33:55.3564453Z
  const now = new Date();
  const isoString = now.toISOString(); // 2025-11-07T10:48:05.699Z
  const timestamp = isoString.replace(/\.(\d{3})Z$/, (match, ms) => {
    // Pad milliseconds to 7 digits (add 4 zeros)
    return '.' + ms + '0000Z';
  });
  
  // Get relative URI (without query string)
  // The relative URI should be the full path including /api/v1
  const relativeUri = `/api/v1${endpoint.split('?')[0]}`;
  
  // Create signature
  const signature = createSignature(
    EXPOSURE_API_KEY,
    method,
    timestamp,
    relativeUri,
    EXPOSURE_SECRET_KEY
  );
  
  // Create authentication header: {API KEY}.{SIGNATURE}
  const authHeader = `${EXPOSURE_API_KEY}.${signature}`;
  
  // Set up headers with authentication and timestamp
  const headers = {
    'Authentication': authHeader,
    'Timestamp': timestamp,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const options = {
    method,
    headers
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const url = `${EXPOSURE_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, options);
    
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
 * /api/v1/exposure/authenticate:
 *   post:
 *     summary: Authenticate with Exposure Events
 *     description: Authenticate event director and obtain API keys (automatically decoded from base64)
 *     tags: [Exposure Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: your-username
 *               password:
 *                 type: string
 *                 example: your-password
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
router.post('/authenticate', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    const result = await authManager.authenticate(username, password);
    
    res.json({
      success: true,
      message: result.message,
      accountId: result.accountId,
      email: result.email
    });
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/exposure/auth-status:
 *   get:
 *     summary: Check authentication status
 *     description: Check if the API is authenticated with Exposure Events
 *     tags: [Exposure Integration]
 *     responses:
 *       200:
 *         description: Authentication status
 */
router.get('/auth-status', async (req, res) => {
  const accountInfo = authManager.getAccountInfo();
  res.json({
    isAuthenticated: authManager.isReady(),
    ...accountInfo
  });
});

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
    const accountInfo = authManager.getAccountInfo();
    const keysConfigured = {
      isAuthenticated: authManager.isReady(),
      accountId: accountInfo.accountId,
      email: accountInfo.email,
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
 *               EventId:
 *                 type: integer
 *                 example: 30
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
      EventId: req.body.eventId || req.body.EventId,
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
 *               EventId:
 *                 type: integer
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

    console.log('PUT /teams/:teamId called');
    console.log('Team ID:', teamId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // First, get the existing team data
    const existingTeamResponse = await exposureRequest(`/teams/${teamId}`);
    console.log('Existing team data:', JSON.stringify(existingTeamResponse, null, 2));
    
    // Extract the Team object from the response
    const existingTeam = existingTeamResponse.Team || existingTeamResponse;

    // Extract EventId from various possible locations
    const eventId = req.body.eventId || req.body.EventId || existingTeam.EventId || existingTeam.Event?.Id;
    const divisionId = req.body.divisionId || req.body.DivisionId || existingTeam.DivisionId || existingTeam.Division?.Id;
    
    console.log('Extracted EventId:', eventId);
    console.log('Extracted DivisionId:', divisionId);

    // Transform frontend data to Exposure Events format, merging with existing data
    const teamData = {
      Id: parseInt(teamId),
      EventId: eventId,
      DivisionId: divisionId,
      Name: req.body.name || req.body.Name || existingTeam.Name,
      Gender: req.body.gender !== undefined ? req.body.gender : (req.body.Gender !== undefined ? req.body.Gender : existingTeam.Gender),
      Paid: req.body.paid !== undefined ? req.body.paid : (req.body.Paid !== undefined ? req.body.Paid : existingTeam.Paid),
      Status: req.body.status !== undefined ? req.body.status : (req.body.Status !== undefined ? req.body.Status : existingTeam.Status),
      Address: req.body.address || req.body.Address || existingTeam.Address,
      Players: req.body.players || req.body.Players || existingTeam.Players || [],
      Notes: req.body.notes !== undefined ? req.body.notes : (req.body.Notes !== undefined ? req.body.Notes : (existingTeam.Notes || '')),
      Website: req.body.website || req.body.Website || existingTeam.Website || '',
      TwitterHandle: req.body.twitterHandle || req.body.TwitterHandle || existingTeam.TwitterHandle || '',
      Abbreviation: req.body.abbreviation || req.body.Abbreviation || existingTeam.Abbreviation || '',
      ExternalTeamId: req.body.externalTeamId || req.body.ExternalTeamId || existingTeam.ExternalTeamId || '',
      InstagramHandle: req.body.instagramHandle || req.body.InstagramHandle || existingTeam.InstagramHandle || '',
      FacebookPage: req.body.facebookPage || req.body.FacebookPage || existingTeam.FacebookPage || ''
    };

    console.log('Update data being sent:', JSON.stringify(teamData, null, 2));
    console.log('Endpoint:', `/teams`);

    const data = await exposureRequest(`/teams`, 'PUT', teamData);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update team',
      message: error.message
    });
  }
});

module.exports = router;