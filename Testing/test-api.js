// Simple test script to verify API endpoints
// Run with: node test-api.js

const BASE_URL = 'http://localhost:3000';
let createdTeamId = null;

async function testAPI() {
  console.log('🧪 Starting API Tests...\n');

  // Test 1: Health Check
  console.log('1️⃣  Testing Health Check...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
    console.log('');
  } catch (error) {
    console.error('❌ Health Check failed:', error.message);
  }

  // Test 2: POST - Create a new team
  console.log('2️⃣  Testing POST /api/v1/teams (Create Team)...');
  try {
    const newTeam = {
      divisionId: 1000,
      name: 'Test Team Alpha',
      gender: 2,
      paid: true,
      status: 1,
      address: {
        city: 'Louisville',
        stateRegion: 'KY',
        postalCode: '40205'
      },
      players: [
        {
          externalPlayerId: 'P1',
          firstName: 'John',
          lastName: 'Doe',
          number: '23'
        }
      ],
      notes: 'Test team created via API',
      website: 'https://example.com',
      twitterHandle: 'testteam',
      abbreviation: 'TTA',
      externalTeamId: 'EXT123',
      instagramHandle: 'testteam',
      facebookPage: 'http://facebook.com/testteam'
    };

    const response = await fetch(`${BASE_URL}/api/v1/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTeam)
    });

    const data = await response.json();
    createdTeamId = data.team?.id;
    console.log('✅ Team Created:', {
      id: data.team?.id,
      name: data.team?.name,
      divisionId: data.team?.divisionId
    });
    console.log('');
  } catch (error) {
    console.error('❌ POST failed:', error.message);
  }

  // Test 3: POST - Create another team
  console.log('3️⃣  Testing POST /api/v1/teams (Create Another Team)...');
  try {
    const newTeam = {
      divisionId: 1001,
      name: 'Test Team Beta',
      gender: 1,
      paid: false,
      abbreviation: 'TTB'
    };

    const response = await fetch(`${BASE_URL}/api/v1/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTeam)
    });

    const data = await response.json();
    console.log('✅ Team Created:', {
      id: data.team?.id,
      name: data.team?.name,
      divisionId: data.team?.divisionId
    });
    console.log('');
  } catch (error) {
    console.error('❌ POST failed:', error.message);
  }

  // Test 4: GET - Retrieve all teams
  console.log('4️⃣  Testing GET /api/v1/teams (Get All Teams)...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/teams`);
    const data = await response.json();
    console.log('✅ Retrieved Teams:', {
      totalResults: data.teams?.totalResults,
      page: data.teams?.page,
      pageSize: data.teams?.pageSize,
      teamsCount: data.teams?.results?.length
    });
    console.log('');
  } catch (error) {
    console.error('❌ GET all teams failed:', error.message);
  }

  // Test 5: GET - Retrieve single team by ID
  if (createdTeamId) {
    console.log('5️⃣  Testing GET /api/v1/teams?id=... (Get Single Team)...');
    try {
      const response = await fetch(`${BASE_URL}/api/v1/teams?id=${createdTeamId}`);
      const data = await response.json();
      console.log('✅ Retrieved Team:', {
        id: data.team?.id,
        name: data.team?.name,
        divisionId: data.team?.divisionId,
        paid: data.team?.paid
      });
      console.log('');
    } catch (error) {
      console.error('❌ GET single team failed:', error.message);
    }
  }

  // Test 6: GET - Filter by division
  console.log('6️⃣  Testing GET /api/v1/teams?divisionId=1000 (Filter by Division)...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/teams?divisionId=1000`);
    const data = await response.json();
    console.log('✅ Filtered Teams:', {
      totalResults: data.teams?.totalResults,
      teamsInDivision: data.teams?.results?.length
    });
    console.log('');
  } catch (error) {
    console.error('❌ GET filtered teams failed:', error.message);
  }

  // Test 7: PUT - Update a team
  if (createdTeamId) {
    console.log('7️⃣  Testing PUT /api/v1/teams (Update Team)...');
    try {
      const updates = {
        name: 'Updated Test Team Alpha',
        paid: true,
        notes: 'Team has been updated',
        address: {
          city: 'New York',
          stateRegion: 'NY',
          postalCode: '10001'
        }
      };

      const response = await fetch(`${BASE_URL}/api/v1/teams?id=${createdTeamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      console.log('✅ Team Updated:', {
        id: data.team?.id,
        name: data.team?.name,
        address: data.team?.address,
        notes: data.team?.notes
      });
      console.log('');
    } catch (error) {
      console.error('❌ PUT failed:', error.message);
    }
  }

  // Test 8: GET - Pagination
  console.log('8️⃣  Testing GET /api/v1/teams?page=1&pageSize=1 (Pagination)...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/teams?page=1&pageSize=1`);
    const data = await response.json();
    console.log('✅ Paginated Teams:', {
      page: data.teams?.page,
      pageSize: data.teams?.pageSize,
      totalResults: data.teams?.totalResults,
      returnedResults: data.teams?.results?.length
    });
    console.log('');
  } catch (error) {
    console.error('❌ GET paginated teams failed:', error.message);
  }

  // Test 9: Error handling - Invalid team ID
  console.log('9️⃣  Testing Error Handling (Invalid Team ID)...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/teams?id=invalid-id`);
    const data = await response.json();
    console.log('✅ Error Response:', {
      status: response.status,
      error: data.error,
      message: data.message
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }

  // Test 10: Error handling - Missing required fields
  console.log('🔟 Testing Error Handling (Missing Required Fields)...');
  try {
    const invalidTeam = {
      name: 'Test Team Without Division'
      // Missing divisionId
    };

    const response = await fetch(`${BASE_URL}/api/v1/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidTeam)
    });

    const data = await response.json();
    console.log('✅ Error Response:', {
      status: response.status,
      error: data.error,
      message: data.message
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }

  console.log('✅ All tests completed!\n');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ for native fetch support.');
  console.log('Please upgrade Node.js or use a fetch polyfill.\n');
  process.exit(1);
}

// Run tests
testAPI().catch(console.error);
