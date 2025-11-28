# Email Integration Guide

## Overview

The Teams API now includes automatic email notifications via Brevo (formerly SendinBlue) for team and player registrations. When creating teams or adding players, registration confirmation emails are automatically sent to the provided email addresses.

## Email Content

All registration emails contain the following message:

> Thank you for registering for the DC34 Memorial Invitational on May 30-31, 2026. Tournament details will be sent out as we get closer to the tournament date.

## Configuration

### Brevo API Key
The API uses the following Brevo API key (configured in `api/email-service.js`):
```
YOUR_API_KEY
```

### Sender Information
- **Sender Name**: DC34 Memorial Invitational
- **Sender Email**: noreply@dc34memorial.com

You can customize these values in `api/email-service.js`.

## API Usage

### 1. Creating a Team (POST /api/v1/teams)

When creating a team, the `email` field is **required** and will receive the registration confirmation email.

**Request Example:**
```json
POST /api/v1/teams
Content-Type: application/json

{
  "divisionId": 1000,
  "name": "Team Exposure",
  "email": "coach@teamexposure.com",
  "gender": 2,
  "paid": false,
  "status": 1,
  "address": {
    "city": "Louisville",
    "stateRegion": "KY",
    "postalCode": "40205"
  }
}
```

**Response Example:**
```json
{
  "message": "Team created successfully",
  "team": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "divisionId": 1000,
    "name": "Team Exposure",
    "email": "coach@teamexposure.com",
    ...
  },
  "emailSent": true
}
```

### 2. Adding Players to a Team (PUT /api/v1/teams)

When updating a team with players, include an `email` field for each player who should receive a registration confirmation email.

**Request Example:**
```json
PUT /api/v1/teams?id=123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "players": [
    {
      "externalPlayerId": "P001",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com",
      "number": "23"
    },
    {
      "externalPlayerId": "P002",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "number": "15"
    },
    {
      "externalPlayerId": "P003",
      "firstName": "Bob",
      "lastName": "Johnson",
      "number": "7"
    }
  ]
}
```

**Note**: In the above example:
- John Smith and Jane Doe will receive registration emails
- Bob Johnson will NOT receive an email (no email provided)

**Response Example:**
```json
{
  "message": "Team updated successfully",
  "team": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "players": [...],
    ...
  },
  "emailsSent": [
    {
      "email": "john.smith@example.com",
      "sent": true
    },
    {
      "email": "jane.doe@example.com",
      "sent": true
    }
  ]
}
```

## Field Requirements

### Team Creation (POST)
- `email` - **REQUIRED** - Team contact email address

### Player Updates (PUT)
- `email` - **OPTIONAL** - Player email address
  - If provided, registration email will be sent
  - If omitted, player is added without email notification

## Email Format

Emails are sent in both HTML and plain text formats:

**HTML Version:**
- Styled with a clean, professional layout
- Includes the DC34 Memorial Invitational branding
- Responsive design for mobile devices

**Plain Text Version:**
- Simple text format for email clients that don't support HTML

## Error Handling

- If email sending fails, the API will still complete the team/player creation
- Email success/failure is logged in the server console
- The response includes `emailSent` (boolean) or `emailsSent` (array) indicating status

## Testing

Use the provided test script to verify email integration:

```bash
# Start the server
node server.js

# In another terminal, run the test script
node test-email-integration.js
```

The test script will:
1. Create a test team with an email address
2. Update the team with multiple players (some with emails, some without)
3. Display the results of email sending

## Monitoring

Check the server console for email sending logs:
- Successful sends: `Email sent successfully to [email]: [messageId]`
- Failed sends: `Failed to send email to [email]: [error details]`

## Troubleshooting

### Emails Not Being Received

1. **Check Brevo API Key**: Ensure the API key in `api/email-service.js` is valid
2. **Verify Email Address**: Make sure the email address is valid and properly formatted
3. **Check Spam Folder**: Emails might be filtered to spam
4. **Review Server Logs**: Check console output for error messages

### Invalid Email Format

The API performs basic validation on email format. If an invalid email is provided:
- For team creation (POST): Returns 400 error
- For player updates (PUT): Skips that player and continues with others

## Customization

To customize the email content or sender information, edit `api/email-service.js`:

```javascript
// Change sender information
sender: {
  name: 'Your Tournament Name',
  email: 'your-email@yourdomain.com'
}

// Change email subject
subject: 'Your Custom Subject'

// Change email content
htmlContent: `Your custom HTML content here`
textContent: 'Your custom plain text content here'
```

## Dependencies

The email integration requires the following npm packages:
- `axios` - For making HTTP requests to the Brevo API
- `@sendinblue/client` - (Installed but not actively used, can be removed)

Install dependencies:
```bash
npm install axios
```
