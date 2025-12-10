const { google } = require('googleapis');
require('dotenv').config();

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY;

/**
 * Initialize Google Sheets API client
 */
let sheetsClient = null;

async function initializeSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  try {
    // Check if configuration is provided
    if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_KEY) {
      console.warn('⚠️  Google Sheets integration not configured. Set GOOGLE_SHEETS_SPREADSHEET_ID and GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY in .env');
      return null;
    }

    // Parse service account key (can be JSON string or base64 encoded)
    let serviceAccountKey;
    try {
      // Try parsing as JSON
      serviceAccountKey = JSON.parse(SERVICE_ACCOUNT_KEY);
    } catch (e) {
      // Try decoding from base64
      try {
        const decoded = Buffer.from(SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
        serviceAccountKey = JSON.parse(decoded);
      } catch (e2) {
        console.error('❌ Failed to parse GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY. Must be JSON or base64-encoded JSON');
        return null;
      }
    }

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheetsClient = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets client initialized successfully');
    return sheetsClient;
  } catch (error) {
    console.error('❌ Error initializing Google Sheets client:', error.message);
    return null;
  }
}

/**
 * Get or create sheet for a specific category
 * @param {string} category - The category (e.g., "U10", "U12", "U14")
 * @returns {Promise<string>} Sheet name
 */
async function getOrCreateSheetForCategory(category) {
  const sheets = await initializeSheetsClient();
  if (!sheets) return null;

  try {
    // Get existing sheets
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetName = `Teams_${category}`;
    const existingSheet = response.data.sheets.find(
      sheet => sheet.properties.title === sheetName
    );

    if (existingSheet) {
      return sheetName;
    }

    // Create new sheet for this category
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    // Add header row
    const headers = [
      'Timestamp',
      'Event ID',
      'Team ID',
      'Team Name',
      'Division ID',
      'Email',
      'Phone',
      'State/Region',
      'Notes',
      'Abbreviation',
      'Coach First Name',
      'Coach Last Name',
      'Paid',
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:M1`,
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    });

    console.log(`✅ Created new sheet: ${sheetName}`);
    return sheetName;
  } catch (error) {
    console.error(`❌ Error getting/creating sheet for category ${category}:`, error.message);
    return null;
  }
}

/**
 * Extract category (U-Number) from division ID or name
 * @param {number|string} divisionId - Division ID or name
 * @param {string} teamName - Team name (fallback)
 * @returns {string} Category (e.g., "U10", "U12", or "Other")
 */
function extractCategory(divisionId, teamName = '') {
  // Try to extract U-number from division ID or team name
  const divisionStr = String(divisionId || '');
  const combined = `${divisionStr} ${teamName}`.toLowerCase();
  
  // Common patterns: U10, U12, U14, U16, U18, etc.
  const match = combined.match(/u-?(\d{1,2})/i);
  if (match) {
    return `U${match[1]}`;
  }
  
  // If no pattern found, return "Other"
  return 'Other';
}

/**
 * Save team data to Google Sheets
 * @param {Object} teamData - Team data to save
 * @param {string} action - Action type ("created" or "updated")
 * @returns {Promise<boolean>} Success status
 */
async function saveTeamToSheets(teamData, action = 'created') {
  const sheets = await initializeSheetsClient();
  if (!sheets) return false;

  try {
    // Extract category from division ID or team name
    const category = extractCategory(teamData.divisionId || teamData.DivisionId, teamData.name || teamData.Name);
    const sheetName = await getOrCreateSheetForCategory(category);
    
    if (!sheetName) {
      console.error('❌ Failed to get/create sheet for category:', category);
      return false;
    }

    // Prepare row data
    const timestamp = new Date().toISOString();
    const eventId = teamData.eventId || teamData.EventId || '';
    const teamId = teamData.id || teamData.Id || '';
    const teamName = teamData.name || teamData.Name || '';
    const divisionId = teamData.divisionId || teamData.DivisionId || '';
    const email = teamData.email || teamData.Email || '';
    const phone = teamData.phone || teamData.Phone || teamData.phoneNumber || teamData.PhoneNumber || '';

    const address = teamData.address || teamData.Address || {};
    const stateRegion = address.stateRegion || address.StateRegion || '';
    
    const notes = teamData.notes || teamData.Notes || '';
    const abbreviation = teamData.abbreviation || teamData.Abbreviation || '';
    
    // Extract coach information from first player (if available)
    const players = teamData.players || teamData.Players || [];
    const coach = players.length > 0 ? players[0] : null;
    const coachFirstName = coach ? (coach.firstName || coach.FirstName || '') : '';
    const coachLastName = coach ? (coach.lastName || coach.LastName || '') : '';
    
    const paid = false; // Always false as per requirements

    const rowData = [
      timestamp,
      eventId,
      teamId,
      teamName,
      divisionId,
      email,
      phone,
      stateRegion,
      notes,
      abbreviation,
      coachFirstName,
      coachLastName,
      paid,
    ];

    // Append row to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:M`,
      valueInputOption: 'RAW',
      resource: {
        values: [rowData],
      },
    });

    console.log(`✅ Team data saved to Google Sheets: ${teamName} (${category}) - ${action}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving team to Google Sheets:', error.message);
    return false;
  }
}

/**
 * Get or create sheet for player data
 * @param {string} category - The category (e.g., "U10", "U12", "U14")
 * @returns {Promise<string>} Sheet name
 */
async function getOrCreatePlayerSheetForCategory(category) {
  const sheets = await initializeSheetsClient();
  if (!sheets) return null;

  try {
    // Get existing sheets
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetName = `Players_${category}`;
    const existingSheet = response.data.sheets.find(
      sheet => sheet.properties.title === sheetName
    );

    if (existingSheet) {
      return sheetName;
    }

    // Create new sheet for player data
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    // Add header row for players
    const headers = [
      'Timestamp',
      'Event ID',
      'Team ID',
      'Division ID',
      'Abbreviation',
      'First Name',
      'Last Name',
      'Email',
      'Grade',
      'Graduation Year',
      'City',
      'State/Region',
      'Postal Code',
      'Active',
      'Phone Number',
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:O1`,
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    });

    console.log(`✅ Created new player sheet: ${sheetName}`);
    return sheetName;
  } catch (error) {
    console.error(`❌ Error getting/creating player sheet for category ${category}:`, error.message);
    return null;
  }
}

/**
 * Save player data to Google Sheets
 * @param {Object} teamData - Team data containing player information
 * @param {Array} players - Array of players to save
 * @returns {Promise<boolean>} Success status
 */
async function savePlayersToSheets(teamData, players) {
  const sheets = await initializeSheetsClient();
  if (!sheets || !players || players.length === 0) return false;

  try {
    // Extract category
    const category = extractCategory(teamData.divisionId || teamData.DivisionId, teamData.name || teamData.Name);
    const sheetName = await getOrCreatePlayerSheetForCategory(category);
    
    if (!sheetName) {
      console.error('❌ Failed to get/create player sheet for category:', category);
      return false;
    }

    const timestamp = new Date().toISOString();
    const eventId = teamData.eventId || teamData.EventId || '';
    const teamId = teamData.id || teamData.Id || '';
    const teamName = teamData.name || teamData.Name || '';
    const divisionId = teamData.divisionId || teamData.DivisionId || '';
    const abbreviation = teamData.abbreviation || teamData.Abbreviation || '';

    // Prepare rows for all players
    const rows = players.map(player => {
      const firstName = player.firstName || player.FirstName || '';
      const lastName = player.lastName || player.LastName || '';
      const email = player.email || player.Email || '';
      const grade = player.grade || player.Grade || '';
      const graduationYear = player.graduationYear || player.GraduationYear || player.gradudationYear || player.GradudationYear || '';
      const city = player.city || player.City || '';
      const stateRegion = player.stateRegion || player.StateRegion || '';
      const postalCode = player.postalCode || player.PostalCode || '';
      const phoneNumber = player.phone || player.Phone || player.phoneNumber || player.PhoneNumber || '';
      const active = player.active !== undefined ? player.active : (player.Active !== undefined ? player.Active : true);

      return [
        timestamp,
        eventId,
        teamId,
        divisionId,
        abbreviation,
        firstName,
        lastName,
        email,
        grade,
        graduationYear,
        city,
        stateRegion,
        postalCode,
        active,
        phoneNumber,
      ];
    });

    // Append rows to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:O`,
      valueInputOption: 'RAW',
      resource: {
        values: rows,
      },
    });

    console.log(`✅ ${players.length} player(s) saved to Google Sheets: ${teamName} (${category})`);
    return true;
  } catch (error) {
    console.error('❌ Error saving players to Google Sheets:', error.message);
    return false;
  }
}

module.exports = {
  saveTeamToSheets,
  savePlayersToSheets,
  extractCategory,
};
