# Google Sheets Integration - Quick Start

## 🚀 5-Minute Setup Guide

Follow these steps to get Google Sheets integration up and running quickly.

## Step 1: Create Google Spreadsheet (1 min)

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it "Teams Registration Data" (or any name you prefer)
4. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                          ↑ THIS IS YOUR SPREADSHEET ID ↑
   ```

## Step 2: Set Up Google Service Account (2 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Enable Google Sheets API:
   - Click **APIs & Services** → **Library**
   - Search for "Google Sheets API"
   - Click **Enable**
4. Create Service Account:
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Name: `teams-api-sheets`
   - Click **Create and Continue** → **Done**
5. Create Key:
   - Click on your new service account
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Select **JSON** → Click **Create**
   - Save the downloaded JSON file

## Step 3: Share Spreadsheet (30 sec)

1. Open the JSON key file you just downloaded
2. Find the `client_email` field (looks like: `teams-api-sheets@project.iam.gserviceaccount.com`)
3. Copy this email
4. Go back to your Google Spreadsheet
5. Click **Share** button
6. Paste the service account email
7. Give it **Editor** permissions
8. Uncheck "Notify people"
9. Click **Share**

## Step 4: Configure Environment (1 min)

### Option A: JSON String (Easiest)

1. Open the JSON key file in a text editor
2. Copy the **entire contents** (it's one line of JSON)
3. Open your `.env` file
4. Add these lines:
   ```env
   GOOGLE_SHEETS_SPREADSHEET_ID=paste_your_spreadsheet_id_here
   GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY={"type":"service_account",...paste entire JSON here...}
   ```

### Option B: Base64 (Cleaner)

**Windows PowerShell:**
```powershell
$content = Get-Content -Path "path\to\service-account-key.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$base64 = [System.Convert]::ToBase64String($bytes)
Write-Output $base64
```

Then add to `.env`:
```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY=paste_base64_string_here
```

## Step 5: Test It! (30 sec)

1. Start your server:
   ```bash
   npm run dev
   ```

2. Look for this message in the console:
   ```
   ✅ Google Sheets client initialized successfully
   ```

3. Create a test team:
   ```bash
   curl -X POST http://localhost:3000/api/v1/teams \
     -H "Content-Type: application/json" \
     -d "{\"divisionId\": 1000, \"name\": \"Test Team U12\", \"email\": \"test@example.com\"}"
   ```

4. Check your Google Spreadsheet:
   - You should see a new sheet: `Teams_U12`
   - It should have a row with your team data

## ✅ You're Done!

Your API will now automatically log:
- ✅ All team registrations to category-specific sheets (e.g., `Teams_U12`)
- ✅ All player updates to category-specific sheets (e.g., `Players_U12`)
- ✅ Data organized by U-Number category (U10, U12, U14, etc.)

## 🧪 Run Full Test Suite

To test all functionality:

```bash
node Testing/test-google-sheets.js
```

This will:
- Create teams in different categories (U10, U12, U14)
- Update teams with player data
- Verify data appears in Google Sheets

## 📊 What Gets Logged

### When POST /api/v1/teams is called:
- Team ID, name, division
- Contact info (email)
- Address (city, state, zip)
- Social media (website, Twitter, Instagram, Facebook)
- Payment status, notes
- Number of players
→ **Saved to**: `Teams_{category}` sheet

### When PUT /api/v1/teams is called with players:
- All player details (name, email, number)
- Position, grade, graduation year
- Physical stats (height, weight)
- Batting/throwing preference
- Address info
- Active status
→ **Saved to**: `Players_{category}` sheet

## 🔍 Troubleshooting

### ⚠️ "Google Sheets integration not configured"
**Fix**: Check that both environment variables are set in `.env`

### ❌ "The caller does not have permission"
**Fix**: Share the spreadsheet with the service account email (check Step 3)

### ❌ "Failed to parse GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY"
**Fix**: Ensure JSON is on one line or try base64 encoding

### ❌ "Requested entity was not found"
**Fix**: Double-check the spreadsheet ID is correct

## 📖 Need More Help?

See the full documentation:
- **Complete Setup Guide**: `Documentation/GOOGLE-SHEETS-SETUP.md`
- **Implementation Details**: `Documentation/GOOGLE-SHEETS-IMPLEMENTATION.md`
- **API Documentation**: `Documentation/README.md`

## 🎉 Pro Tips

1. **One spreadsheet per environment**: Use different spreadsheets for dev/staging/production
2. **Monitor quota**: Google Sheets API has usage limits (check Cloud Console)
3. **Regular backups**: Export your data periodically
4. **Custom views**: Use Google Sheets filtering and pivot tables to analyze data
5. **Share carefully**: Only share with necessary team members

---

**Need help?** Check the server console for detailed error messages!
