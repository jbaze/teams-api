# Google Sheets Integration Setup Guide

This guide explains how to set up Google Sheets integration for automatically logging team registrations and player updates.

## Overview

The Teams API automatically saves data to Google Sheets when:
- **POST** requests are made to `/api/v1/teams` or `/api/v1/exposure/teams` (team creation)
- **PUT** requests are made to `/api/v1/teams` or `/api/v1/exposure/teams/:teamId` (player updates)

Data is organized by **category** (U-Number), with each category getting its own sheets:
- `Teams_U10`, `Teams_U12`, `Teams_U14`, etc. for team data
- `Players_U10`, `Players_U12`, `Players_U14`, etc. for player data
- `Teams_Other` and `Players_Other` for teams without a recognized U-Number category

## Prerequisites

- A Google account
- Access to Google Cloud Console
- A Google Spreadsheet where data will be logged

## Step 1: Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet (or use an existing one)
3. Note the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
4. Save this ID for later configuration

## Step 2: Set Up Google Cloud Service Account

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your project name/ID

### 2.2 Enable Google Sheets API

1. In the Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Sheets API"
3. Click on it and click **Enable**

### 2.3 Create a Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Fill in the details:
   - **Service account name**: `teams-api-sheets` (or any name)
   - **Description**: Service account for Teams API Google Sheets integration
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**

### 2.4 Create and Download Service Account Key

1. Find your newly created service account in the list
2. Click on it to open details
3. Go to the **Keys** tab
4. Click **Add Key** > **Create new key**
5. Select **JSON** format
6. Click **Create**
7. A JSON file will be downloaded to your computer
8. **Keep this file secure** - it contains credentials for accessing your Google account

## Step 3: Share Spreadsheet with Service Account

1. Open the JSON key file you downloaded
2. Find the `client_email` field (looks like: `teams-api-sheets@project-name.iam.gserviceaccount.com`)
3. Copy this email address
4. Open your Google Spreadsheet
5. Click **Share** button
6. Paste the service account email
7. Give it **Editor** permissions
8. Uncheck "Notify people" (it's a service account, not a person)
9. Click **Share**

## Step 4: Configure Environment Variables

### Option A: Use JSON String (Easier for Development)

1. Open the JSON key file in a text editor
2. Copy the **entire contents** (it should be one long line of JSON)
3. Add to your `.env` file:
   ```env
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_from_step_1
   GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
   ```

### Option B: Use Base64 Encoding (Better for Production)

1. Encode the JSON file to base64:
   
   **Windows (PowerShell):**
   ```powershell
   $content = Get-Content -Path "path\to\your\service-account-key.json" -Raw
   $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
   $base64 = [System.Convert]::ToBase64String($bytes)
   Write-Output $base64
   ```
   
   **Mac/Linux:**
   ```bash
   base64 -i path/to/your/service-account-key.json
   ```

2. Add to your `.env` file:
   ```env
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY=base64_encoded_string_here
   ```

## Step 5: Test the Integration

1. Start your server:
   ```bash
   npm run dev
   ```

2. Check the console output - you should see:
   ```
   ✅ Google Sheets client initialized successfully
   ```

3. Create a test team using the API:
   ```bash
   curl -X POST http://localhost:3000/api/v1/teams \
     -H "Content-Type: application/json" \
     -d '{
       "divisionId": 1000,
       "name": "Test Team U12",
       "email": "test@example.com"
     }'
   ```

4. Check your Google Spreadsheet - you should see:
   - A new sheet named `Teams_U12`
   - A row with your team data

## Data Structure

### Team Sheets (`Teams_U10`, `Teams_U12`, etc.)

| Column | Description |
|--------|-------------|
| Timestamp | When the record was created |
| Team ID | Unique team identifier |
| Team Name | Name of the team |
| Division ID | Division identifier |
| Category | U-Number category (U10, U12, etc.) |
| Gender | Gender code |
| Paid | Payment status |
| Status | Team status |
| Email | Team contact email |
| City | Team city |
| State/Region | Team state/region |
| Postal Code | Team postal code |
| Website | Team website |
| Twitter | Twitter handle |
| Instagram | Instagram handle |
| Facebook | Facebook page |
| Notes | Additional notes |
| Player Count | Number of players |

### Player Sheets (`Players_U10`, `Players_U12`, etc.)

| Column | Description |
|--------|-------------|
| Timestamp | When the record was created |
| Team ID | Team identifier |
| Team Name | Name of the team |
| Division ID | Division identifier |
| Category | U-Number category |
| Player ID | Unique player identifier |
| First Name | Player's first name |
| Last Name | Player's last name |
| Email | Player's email |
| Number | Jersey number |
| Position | Playing position |
| Grade | Current grade |
| Graduation Year | Year of graduation |
| School | School name |
| Height | Player height |
| Weight | Player weight |
| Bats | Batting preference (0=Right, 1=Left, 2=Switch) |
| Throws | Throwing hand (0=Right, 1=Left) |
| City | Player city |
| State/Region | Player state/region |
| Postal Code | Player postal code |
| Active | Player active status |

## Category Detection

The system automatically detects the U-Number category from:
1. **Division ID** - Looks for patterns like "U10", "U12", "U-14", etc.
2. **Team Name** - If division ID doesn't contain a category, checks the team name
3. **Default** - If no category is found, uses "Other"

Examples:
- Team with divisionId "1000" and name "Thunder U12" → Category: `U12`
- Team with divisionId "2000" and name "Elite U-14 Girls" → Category: `U14`
- Team with divisionId "5000" and name "All Stars" → Category: `Other`

## Troubleshooting

### ⚠️ "Google Sheets integration not configured"

**Problem**: The service account key or spreadsheet ID is not set in `.env`

**Solution**: 
- Verify `GOOGLE_SHEETS_SPREADSHEET_ID` is set
- Verify `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY` is set
- Restart your server after adding environment variables

### ❌ "Failed to parse GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY"

**Problem**: The service account key is not valid JSON or base64

**Solution**:
- If using JSON directly, ensure it's properly formatted (no line breaks in the middle of strings)
- If using base64, verify the encoding was done correctly
- Try the other encoding method (JSON string vs base64)

### ❌ "The caller does not have permission"

**Problem**: The service account doesn't have access to the spreadsheet

**Solution**:
1. Open your Google Spreadsheet
2. Click **Share**
3. Verify the service account email is listed with "Editor" permissions
4. If not, add it again following Step 3

### ❌ "Requested entity was not found"

**Problem**: The spreadsheet ID is incorrect

**Solution**:
- Double-check the spreadsheet ID in your `.env` file
- Ensure you're copying the ID from the URL, not the spreadsheet name
- The ID should look like: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### No data appearing in sheets

**Problem**: Integration is working but data isn't saved

**Solution**:
1. Check server console for error messages
2. Verify the service account has "Editor" (not just "Viewer") permissions
3. Try manually creating a sheet named `Teams_U12` and see if data appears
4. Check if sheets are being created but in a different spreadsheet

## Security Best Practices

1. **Never commit** the service account JSON file to version control
2. **Never commit** the `.env` file with credentials to version control
3. Add to `.gitignore`:
   ```
   .env
   *.json
   !package.json
   !package-lock.json
   ```
4. For production, use environment variables from your hosting provider
5. Consider using base64 encoding for cleaner environment variable storage
6. Regularly rotate service account keys (every 90 days recommended)
7. Use separate service accounts for development and production

## Optional: Disable Google Sheets Integration

If you want to disable Google Sheets integration temporarily:

1. Remove or comment out the environment variables in `.env`:
   ```env
   # GOOGLE_SHEETS_SPREADSHEET_ID=...
   # GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY=...
   ```

2. Restart your server

The API will continue to work normally, but data won't be logged to Google Sheets. You'll see a warning in the console:
```
⚠️  Google Sheets integration not configured
```

## Support

If you encounter issues:
1. Check the server console logs for specific error messages
2. Verify all steps in this guide have been completed
3. Ensure the Google Sheets API is enabled in your Google Cloud project
4. Verify the service account has the correct permissions

## Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Google Cloud Console](https://console.cloud.google.com)
