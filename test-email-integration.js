/**
 * Test script for email integration with team creation and updates
 * 
 * This script demonstrates how to:
 * 1. Create a team with an email (triggers registration email)
 * 2. Update a team with players (triggers emails to players with email addresses)
 */

const axios = require('axios');

// Update this URL if testing against a different server
const BASE_URL = 'http://localhost:3000';

async function testTeamCreationWithEmail() {
  console.log('\n=== Testing Team Creation with Email ===\n');
  
  try {
    const teamData = {
      divisionId: 1000,
      name: 'Test Eagles',
      email: 'coach@testeagles.com', // Required field - email sent to this address
      gender: 2,
      paid: false,
      status: 1,
      address: {
        city: 'Louisville',
        stateRegion: 'KY',
        postalCode: '40205'
      },
      notes: 'Test team for email integration'
    };

    console.log('Creating team with email:', teamData.email);
    const response = await axios.post(`${BASE_URL}/api/v1/teams`, teamData);
    
    console.log('✓ Team created successfully!');
    console.log('Team ID:', response.data.team.id);
    console.log('Email sent:', response.data.emailSent);
    
    return response.data.team.id;
  } catch (error) {
    console.error('✗ Failed to create team:');
    console.error(error.response?.data || error.message);
    throw error;
  }
}

async function testTeamUpdateWithPlayers(teamId) {
  console.log('\n=== Testing Team Update with Players ===\n');
  
  try {
    const updateData = {
      players: [
        {
          externalPlayerId: 'P001',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com', // Email sent to this player
          number: '23'
        },
        {
          externalPlayerId: 'P002',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com', // Email sent to this player
          number: '15'
        },
        {
          externalPlayerId: 'P003',
          firstName: 'Bob',
          lastName: 'Johnson',
          number: '7'
          // No email - no registration email sent for this player
        }
      ]
    };

    console.log('Updating team with', updateData.players.length, 'players');
    const response = await axios.put(`${BASE_URL}/api/v1/teams?id=${teamId}`, updateData);
    
    console.log('✓ Team updated successfully!');
    console.log('Players added:', response.data.team.players.length);
    
    if (response.data.emailsSent) {
      console.log('\nEmails sent to players:');
      response.data.emailsSent.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.email} - ${result.sent ? '✓ Sent' : '✗ Failed'}`);
      });
    }
  } catch (error) {
    console.error('✗ Failed to update team:');
    console.error(error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('========================================');
  console.log('Email Integration Test Suite');
  console.log('========================================');
  console.log('Server:', BASE_URL);
  console.log('========================================');

  try {
    // Test 1: Create team with email
    const teamId = await testTeamCreationWithEmail();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Update team with players
    await testTeamUpdateWithPlayers(teamId);
    
    console.log('\n========================================');
    console.log('✓ All tests completed successfully!');
    console.log('========================================\n');
  } catch (error) {
    console.log('\n========================================');
    console.log('✗ Tests failed');
    console.log('========================================\n');
    process.exit(1);
  }
}

// Check if server is specified as argument
if (process.argv[2]) {
  const customUrl = process.argv[2];
  BASE_URL = customUrl;
  console.log('Using custom server URL:', BASE_URL);
}

// Run the tests
runTests();
