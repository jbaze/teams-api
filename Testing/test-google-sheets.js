/**
 * Google Sheets Integration Test Script
 * 
 * This script tests the Google Sheets integration by:
 * 1. Creating teams with different U-Number categories
 * 2. Updating teams with player data
 * 
 * Prerequisites:
 * - Google Sheets must be configured in .env
 * - Server must be running (npm run dev)
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test data for different categories
const testTeams = [
  {
    divisionId: 1000,
    name: 'Thunder U10',
    email: 'test-u10@example.com',
    address: {
      city: 'Louisville',
      stateRegion: 'KY',
      postalCode: '40205',
    },
    expectedCategory: 'U10',
  },
  {
    divisionId: 2000,
    name: 'Lightning U12',
    email: 'test-u12@example.com',
    address: {
      city: 'Nashville',
      stateRegion: 'TN',
      postalCode: '37201',
    },
    expectedCategory: 'U12',
  },
  {
    divisionId: 3000,
    name: 'Storm U14 Elite',
    email: 'test-u14@example.com',
    address: {
      city: 'Memphis',
      stateRegion: 'TN',
      postalCode: '38103',
    },
    expectedCategory: 'U14',
  },
];

const testPlayers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    number: '23',
    position: 'Forward',
    grade: '5',
    graduationYear: 2030,
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    number: '12',
    position: 'Guard',
    grade: '6',
    graduationYear: 2029,
  },
];

async function testHealthCheck() {
  log('\n📋 Step 1: Health Check', 'blue');
  try {
    const response = await axios.get(`${API_BASE}/../health`);
    log(`✓ API is healthy (${response.data.teamsCount} teams in memory)`, 'green');
    return true;
  } catch (error) {
    log(`✗ Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testCreateTeams() {
  log('\n📋 Step 2: Creating Teams (POST)', 'blue');
  const createdTeams = [];

  for (const teamData of testTeams) {
    try {
      log(`\n  Creating team: ${teamData.name}`, 'yellow');
      const response = await axios.post(`${API_BASE}/teams`, teamData);

      if (response.data.team) {
        createdTeams.push({
          id: response.data.team.id,
          name: response.data.team.name,
          expectedCategory: teamData.expectedCategory,
        });
        log(`  ✓ Team created: ${response.data.team.name}`, 'green');
        log(`    - Team ID: ${response.data.team.id}`, 'green');
        log(`    - Email sent: ${response.data.emailSent || false}`, 'green');
        log(`    - Expected in Google Sheets: Teams_${teamData.expectedCategory}`, 'green');
      }
    } catch (error) {
      log(`  ✗ Failed to create team: ${error.message}`, 'red');
      if (error.response) {
        log(`    Error: ${JSON.stringify(error.response.data)}`, 'red');
      }
    }
  }

  return createdTeams;
}

async function testUpdateTeamsWithPlayers(createdTeams) {
  log('\n📋 Step 3: Updating Teams with Players (PUT)', 'blue');

  for (const team of createdTeams) {
    try {
      log(`\n  Updating team: ${team.name}`, 'yellow');
      const response = await axios.put(`${API_BASE}/teams?id=${team.id}`, {
        players: testPlayers,
      });

      if (response.data.team) {
        log(`  ✓ Team updated: ${response.data.team.name}`, 'green');
        log(`    - Players added: ${response.data.team.players.length}`, 'green');
        if (response.data.emailsSent) {
          log(`    - Emails sent: ${response.data.emailsSent.length}`, 'green');
        }
        log(`    - Expected in Google Sheets: Players_${team.expectedCategory}`, 'green');
      }
    } catch (error) {
      log(`  ✗ Failed to update team: ${error.message}`, 'red');
      if (error.response) {
        log(`    Error: ${JSON.stringify(error.response.data)}`, 'red');
      }
    }
  }
}

async function testExposureTeam() {
  log('\n📋 Step 4: Testing Exposure API Integration (Optional)', 'blue');
  log('  ⚠️  This step requires Exposure Events authentication', 'yellow');
  log('  Skipping Exposure API test...', 'yellow');
  log('  (You can test this manually via Swagger docs)', 'yellow');
}

async function displayResults() {
  log('\n' + '='.repeat(60), 'blue');
  log('TEST RESULTS SUMMARY', 'blue');
  log('='.repeat(60), 'blue');

  log('\n📊 What to Check in Google Sheets:', 'yellow');
  log('  1. Open your Google Spreadsheet', 'reset');
  log('  2. You should see new sheets created:', 'reset');
  log('     - Teams_U10', 'reset');
  log('     - Teams_U12', 'reset');
  log('     - Teams_U14', 'reset');
  log('     - Players_U10', 'reset');
  log('     - Players_U12', 'reset');
  log('     - Players_U14', 'reset');
  log('  3. Each sheet should have data from the test', 'reset');

  log('\n📧 Email Notifications:', 'yellow');
  log('  - Check the test email addresses for registration confirmations', 'reset');
  log('  - Both team and player emails should have been sent', 'reset');

  log('\n🔍 If Data is Missing:', 'yellow');
  log('  1. Check server console for Google Sheets errors', 'reset');
  log('  2. Verify GOOGLE_SHEETS_SPREADSHEET_ID is set', 'reset');
  log('  3. Verify GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY is set', 'reset');
  log('  4. Verify spreadsheet is shared with service account', 'reset');

  log('\n✅ Test Complete!', 'green');
  log('='.repeat(60) + '\n', 'blue');
}

async function runTests() {
  log('='.repeat(60), 'blue');
  log('GOOGLE SHEETS INTEGRATION TEST', 'blue');
  log('='.repeat(60), 'blue');

  try {
    // Step 1: Health check
    const isHealthy = await testHealthCheck();
    if (!isHealthy) {
      log('\n❌ Server is not running or not responding', 'red');
      log('Please start the server with: npm run dev', 'yellow');
      return;
    }

    // Step 2: Create teams
    const createdTeams = await testCreateTeams();
    if (createdTeams.length === 0) {
      log('\n❌ No teams were created. Check server logs for errors.', 'red');
      return;
    }

    // Wait a bit for sheets to process
    log('\n⏳ Waiting 2 seconds for Google Sheets to process...', 'yellow');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 3: Update teams with players
    await testUpdateTeamsWithPlayers(createdTeams);

    // Wait a bit for sheets to process
    log('\n⏳ Waiting 2 seconds for Google Sheets to process...', 'yellow');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 4: Test Exposure API (optional)
    await testExposureTeam();

    // Display results
    await displayResults();
  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the tests
runTests().catch(console.error);
