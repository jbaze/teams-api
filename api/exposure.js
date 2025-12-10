const express = require('express');
const crypto = require('crypto');
const authManager = require('./auth-manager');
const { sendRegistrationEmail } = require('./email-service');
const { saveTeamToSheets, savePlayersToSheets } = require('./sheets-service');
const router = express.Router();

const EXPOSURE_USERNAME = 'tcaymol';
const EXPOSURE_PASSWORD = 'Buggy4498!';

// Exposure Events API configuration
const EXPOSURE_BASE_URL = process.env.EXPOSURE_BASE_URL || 'https://softball.exposureevents.com/api/v1';

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
async function exposureRequest(endpoint, method = 'GET', body = null, retryCount = 0) {
  // Check if authenticated, if not try to re-authenticate
  if (!authManager.isReady() && retryCount === 0) {
    console.log('Not authenticated, attempting to authenticate with hardcoded credentials...');
    try {
      await authManager.authenticate(EXPOSURE_USERNAME, EXPOSURE_PASSWORD);
      console.log('Authentication successful, retrying request...');
      return await exposureRequest(endpoint, method, body, retryCount + 1);
    } catch (authError) {
      console.error('Authentication failed:', authError.message);
      throw new Error('Not authenticated. Authentication attempt failed: ' + authError.message);
    }
  }
  
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
 *               Email:
 *                 type: string
 *                 format: email
 *                 description: Team contact email for registration confirmation
 *                 example: coach@teamexposure.com
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
 *                     Email:
 *                       type: string
 *                       format: email
 *                       description: Player email for registration confirmation
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
    // Extract email and phone from request (support both camelCase and PascalCase)
    const teamEmail = req.body.email || req.body.Email;
    const teamPhone = req.body.phone || req.body.Phone || req.body.phoneNumber || req.body.PhoneNumber;

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
    
    // Send registration email if email is provided
    let emailResult = null;
    if (teamEmail) {
      console.log('Sending registration email to:', teamEmail);
      emailResult = await sendRegistrationEmail(teamEmail, teamData.Name);
    }

    // Save team data to Google Sheets (with the ID returned from Exposure API, email and phone)
    const teamDataWithId = {
      ...teamData,
      Id: data.id || data.Id,
      id: data.id || data.Id,
      Email: teamEmail,
      email: teamEmail,
      Phone: teamPhone,
      phone: teamPhone
    };
    await saveTeamToSheets(teamDataWithId, 'created');
    
    res.status(201).json({
      ...data,
      emailSent: emailResult ? emailResult.success : false
    });
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
 *     description: Update an existing team in Exposure Events platform. Only provided fields will be updated.
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
 *                 description: Event identifier
 *               DivisionId:
 *                 type: integer
 *                 description: Division identifier
 *               Name:
 *                 type: string
 *                 description: Team name
 *               Age:
 *                 type: integer
 *                 description: Age group/category
 *               Grade:
 *                 type: integer
 *                 description: Grade level
 *               ExternalTeamId:
 *                 type: string
 *                 description: External team identifier
 *               Gender:
 *                 type: integer
 *                 description: Gender (1=Male, 2=Female)
 *               Paid:
 *                 type: boolean
 *                 description: Payment status
 *               Status:
 *                 type: integer
 *                 description: Team status
 *               Address:
 *                 type: object
 *                 properties:
 *                   City:
 *                     type: string
 *                   StateRegion:
 *                     type: string
 *                   PostalCode:
 *                     type: string
 *               Notes:
 *                 type: string
 *                 description: Team notes
 *               Website:
 *                 type: string
 *                 description: Team website URL
 *               TwitterHandle:
 *                 type: string
 *                 description: Twitter handle
 *               Abbreviation:
 *                 type: string
 *                 description: Team abbreviation
 *               Players:
 *                 type: array
 *                 description: Array of players to add/update
 *                 items:
 *                   type: object
 *                   properties:
 *                     FirstName:
 *                       type: string
 *                     LastName:
 *                       type: string
 *                     City:
 *                       type: string
 *                     StateRegion:
 *                       type: string
 *                     PostalCode:
 *                       type: string
 *                     Position:
 *                       type: string
 *                     Bats:
 *                       type: integer
 *                       description: Batting preference (0=Right, 1=Left, 2=Switch)
 *                     Throws:
 *                       type: integer
 *                       description: Throwing hand (0=Right, 1=Left)
 *                     Height:
 *                       type: string
 *                       description: Player height
 *                     Weight:
 *                       type: integer
 *                       description: Player weight (max 3 digits)
 *                     GradudationYear:
 *                       type: integer
 *                       description: Graduation year (4 digits)
 *                     Grade:
 *                       type: string
 *                       description: Current grade
 *                     School:
 *                       type: string
 *                       description: School name
 *                     Email:
 *                       type: string
 *                       format: email
 *                       description: Player email for registration confirmation
 *                     Phone:
 *                       type: string
 *                       description: Player phone number (e.g., +12345678901)
 *                     Number:
 *                       type: integer
 *                       description: Jersey number (max 3 digits)
 *                     Active:
 *                       type: boolean
 *                       description: Player active status
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

    // Extract email and phone from request (support both camelCase and PascalCase)
    const teamEmail = req.body.email || req.body.Email;
    const teamPhone = req.body.phone || req.body.Phone || req.body.phoneNumber || req.body.PhoneNumber;

    // Build update data - only include fields that are provided in the request
    const teamData = {
      Id: parseInt(teamId),
      Email: teamEmail,
      email: teamEmail,
      Phone: teamPhone,
      phone: teamPhone
    };

    // Add all possible fields if they are provided (supports both camelCase and PascalCase)
    if (req.body.eventId !== undefined || req.body.EventId !== undefined) {
      teamData.EventId = req.body.eventId || req.body.EventId;
    }
    if (req.body.divisionId !== undefined || req.body.DivisionId !== undefined) {
      teamData.DivisionId = req.body.divisionId || req.body.DivisionId;
    }
    if (req.body.name || req.body.Name) {
      teamData.Name = req.body.name || req.body.Name;
    }
    if (req.body.age !== undefined || req.body.Age !== undefined) {
      teamData.Age = req.body.age || req.body.Age;
    }
    if (req.body.grade !== undefined || req.body.Grade !== undefined) {
      teamData.Grade = req.body.grade || req.body.Grade;
    }
    if (req.body.externalTeamId || req.body.ExternalTeamId) {
      teamData.ExternalTeamId = req.body.externalTeamId || req.body.ExternalTeamId;
    }
    if (req.body.gender !== undefined || req.body.Gender !== undefined) {
      teamData.Gender = req.body.gender || req.body.Gender;
    }
    if (req.body.paid !== undefined || req.body.Paid !== undefined) {
      teamData.Paid = req.body.paid || req.body.Paid;
    }
    if (req.body.status !== undefined || req.body.Status !== undefined) {
      teamData.Status = req.body.status || req.body.Status;
    }
    
    // Address fields
    if (req.body.address || req.body.Address) {
      const addr = req.body.address || req.body.Address;
      teamData.Address = {
        City: addr.city || addr.City,
        StateRegion: addr.stateRegion || addr.StateRegion,
        PostalCode: addr.postalCode || addr.PostalCode
      };
    }
    
    if (req.body.notes !== undefined || req.body.Notes !== undefined) {
      teamData.Notes = req.body.notes || req.body.Notes;
    }
    if (req.body.website || req.body.Website) {
      teamData.Website = req.body.website || req.body.Website;
    }
    if (req.body.twitterHandle || req.body.TwitterHandle) {
      teamData.TwitterHandle = req.body.twitterHandle || req.body.TwitterHandle;
    }
    if (req.body.abbreviation || req.body.Abbreviation) {
      teamData.Abbreviation = req.body.abbreviation || req.body.Abbreviation;
    }
    
    // Players array with all supported fields
    if (req.body.players || req.body.Players) {
      const playersInput = req.body.players || req.body.Players;
      teamData.Players = playersInput.map(player => {
        const playerData = {};
        
        // Player ID (for updating existing players)
        if (player.id !== undefined || player.Id !== undefined) {
          playerData.Id = player.id || player.Id;
        }
        
        if (player.firstName || player.FirstName) playerData.FirstName = player.firstName || player.FirstName;
        if (player.lastName || player.LastName) playerData.LastName = player.lastName || player.LastName;
        if (player.city || player.City) playerData.City = player.city || player.City;
        if (player.stateRegion || player.StateRegion) playerData.StateRegion = player.stateRegion || player.StateRegion;
        if (player.postalCode || player.PostalCode) playerData.PostalCode = player.postalCode || player.PostalCode;
        if (player.position || player.Position) playerData.Position = player.position || player.Position;
        if (player.bats !== undefined || player.Bats !== undefined) playerData.Bats = player.bats || player.Bats;
        if (player.throws !== undefined || player.Throws !== undefined) playerData.Throws = player.throws || player.Throws;
        if (player.height || player.Height) playerData.Height = player.height || player.Height;
        if (player.weight !== undefined || player.Weight !== undefined) playerData.Weight = player.weight || player.Weight;
        if (player.graduationYear || player.GraduationYear || player.gradudationYear || player.GradudationYear) {
          playerData.GradudationYear = player.graduationYear || player.GraduationYear || player.gradudationYear || player.GradudationYear;
        }
        if (player.grade || player.Grade) playerData.Grade = player.grade || player.Grade;
        if (player.school || player.School) playerData.School = player.school || player.School;
        if (player.email || player.Email) playerData.Email = player.email || player.Email;
        if (player.phone || player.Phone || player.phoneNumber || player.PhoneNumber) {
          playerData.PhoneNumber = player.phone || player.Phone || player.phoneNumber || player.PhoneNumber;
        }
        if (player.number !== undefined || player.Number !== undefined) playerData.Number = player.number || player.Number;
        
        playerData.Active = player.active !== undefined ? player.active : (player.Active !== undefined ? player.Active : false);
        
        return playerData;
      });
    }

    console.log('Update data being sent:', JSON.stringify(teamData, null, 2));

    const data = await exposureRequest(`/teams`, 'PUT', teamData);
    
    // Send registration emails to players if they have email addresses
    const emailResults = [];
    if (req.body.players || req.body.Players) {
      const playersInput = req.body.players || req.body.Players;
      for (const player of playersInput) {
        const playerEmail = player.email || player.Email;
        if (playerEmail) {
          const firstName = player.firstName || player.FirstName || '';
          const lastName = player.lastName || player.LastName || '';
          const playerName = `${firstName} ${lastName}`.trim();
          console.log('Sending registration email to player:', playerEmail);
          const emailResult = await sendRegistrationEmail(playerEmail, playerName || 'Player');
          emailResults.push({
            email: playerEmail,
            sent: emailResult.success
          });
        }
      }
    }

    // Save player data to Google Sheets
    if (req.body.players || req.body.Players) {
      const playersInput = req.body.players || req.body.Players;
      await savePlayersToSheets(teamData, playersInput);
    }
    
    res.json({
      ...data,
      emailsSent: emailResults.length > 0 ? emailResults : undefined
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update team',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/exposure/players:
 *   get:
 *     summary: Get players
 *     description: Retrieve players with optional filters (paginated). All parameters are optional.
 *     tags: [Exposure Integration]
 *     parameters:
 *       - in: query
 *         name: teamIds
 *         schema:
 *           type: string
 *         description: Team ID or comma-separated list of team IDs (e.g., "123" or "123,456,789")
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: integer
 *         description: Filter by event ID
 *       - in: query
 *         name: divisionId
 *         schema:
 *           type: integer
 *         description: Filter by division ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Results per page
 *       - in: query
 *         name: includes
 *         schema:
 *           type: string
 *         description: Additional data to include (comma-separated)
 *     responses:
 *       200:
 *         description: Players retrieved successfully
 *       500:
 *         description: Error fetching players
 */
router.get('/players', async (req, res) => {
  try {
    const { teamIds, eventId, divisionId, page, pageSize, includes } = req.query;

    console.log('GET /players called');
    console.log('Query params:', { teamIds, eventId, divisionId, page, pageSize, includes });

    // Build query string - all filters are optional
    const params = new URLSearchParams();
    if (teamIds) params.append('teamids', teamIds);
    if (eventId) params.append('eventid', eventId);
    if (divisionId) params.append('divisionid', divisionId);
    if (page) params.append('page', page);
    if (pageSize) params.append('pagesize', pageSize);
    
    // Automatically include teams, and add any additional includes from user
    let includesValue = 'teams';
    if (includes) {
      includesValue = includes.includes('teams') ? includes : `teams,${includes}`;
    }
    params.append('includes', includesValue);

    const endpoint = `/players?${params.toString()}`;
    console.log('Endpoint:', endpoint);

    const data = await exposureRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch players',
      message: error.message
    });
  }
});

module.exports = router;
