# Quick Start: Email Integration

## Setup
```bash
# Install dependencies (if not already installed)
npm install

# Start the server
npm start
```

## Test Email Integration

### Option 1: Use the Test Script
```bash
node test-email-integration.js
```

### Option 2: Manual API Testing

#### 1. Create a Team with Email
```bash
curl -X POST http://localhost:3000/api/v1/teams \
  -H "Content-Type: application/json" \
  -d "{
    \"divisionId\": 1000,
    \"name\": \"Test Eagles\",
    \"email\": \"YOUR_EMAIL@example.com\"
  }"
```

✅ **Result:** Registration email sent to the team contact

#### 2. Add Players with Emails
```bash
# Replace TEAM_ID with the ID from step 1
curl -X PUT "http://localhost:3000/api/v1/teams?id=TEAM_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"players\": [
      {
        \"firstName\": \"John\",
        \"lastName\": \"Smith\",
        \"email\": \"player1@example.com\",
        \"number\": \"23\"
      },
      {
        \"firstName\": \"Jane\",
        \"lastName\": \"Doe\",
        \"email\": \"player2@example.com\",
        \"number\": \"15\"
      }
    ]
  }"
```

✅ **Result:** Registration emails sent to all players with email addresses

## What Gets Sent?

**Email Subject:** Registration Confirmation - DC34 Memorial Invitational

**Email Content:**
> Thank you for registering for the DC34 Memorial Invitational on May 30-31, 2026. Tournament details will be sent out as we get closer to the tournament date.

## Check Email Status

The API response will indicate if emails were sent:

**POST Response:**
```json
{
  "message": "Team created successfully",
  "team": { ... },
  "emailSent": true  // ← Email status
}
```

**PUT Response:**
```json
{
  "message": "Team updated successfully",
  "team": { ... },
  "emailsSent": [    // ← Email status for each player
    { "email": "player1@example.com", "sent": true },
    { "email": "player2@example.com", "sent": true }
  ]
}
```

## Swagger Documentation

View complete API documentation at:
```
http://localhost:3000/api-docs
```

## Important Notes

1. **Team email is REQUIRED** when creating a team (POST)
2. **Player email is OPTIONAL** when adding players (PUT)
3. Players without emails are added normally without notification
4. Email failures don't prevent team/player creation
5. Check server console for detailed email logs

## Troubleshooting

**No email received?**
- Check your spam/junk folder
- Verify email address is correct
- Check server console for errors
- Ensure Brevo API key is valid

**Need help?**
See `Documentation/EMAIL-INTEGRATION.md` for detailed documentation
