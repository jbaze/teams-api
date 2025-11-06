# 🔗 Exposure Events Integration Guide

Your API now acts as a **proxy** to Exposure Events, handling authentication and providing a clean interface for your frontend.

## 🎯 What This Does

Your API integrates with Exposure Events to:
- ✅ Create teams on Exposure Events platform
- ✅ Fetch teams from Exposure Events
- ✅ Update teams on Exposure Events
- ✅ Get events and divisions
- ✅ Handle Stripe payments separately

## 🔑 API Keys Configured

```env
EXPOSURE_API_KEY=9bZ9A99u99999M
EXPOSURE_SECRET_KEY=E99pWXF9emeW6Bs7X659lH9vhr7aPcOE
EXPOSURE_BASE_URL=https://basketball.exposureevents.com/api/v1
```

These are already configured in your `.env` file!

---

## 📍 Available Endpoints

### **1. Get Events**
```
GET /api/v1/exposure/events
```

**Frontend Example:**
```javascript
const response = await fetch('https://your-api.vercel.app/api/v1/exposure/events');
const events = await response.json();
```

---

### **2. Get Single Event**
```
GET /api/v1/exposure/events/:eventId
```

**Frontend Example:**
```javascript
const response = await fetch('https://your-api.vercel.app/api/v1/exposure/events/30');
const event = await response.json();
```

---

### **3. Get Divisions**
```
GET /api/v1/exposure/divisions?eventId=30
```

**Frontend Example:**
```javascript
const response = await fetch('https://your-api.vercel.app/api/v1/exposure/divisions?eventId=30');
const divisions = await response.json();
```

---

### **4. Create Team on Exposure Events** ⭐
```
POST /api/v1/exposure/teams
```

**Frontend Example:**
```javascript
const teamData = {
  divisionId: 1000,           // or DivisionId (both work)
  name: "Team Awesome",       // or Name
  gender: 2,                  // 1=Male, 2=Female
  paid: true,
  address: {
    city: "Louisville",       // or City
    stateRegion: "KY",        // or StateRegion
    postalCode: "40205"       // or PostalCode
  },
  players: [
    {
      firstName: "John",       // or FirstName
      lastName: "Doe",        // or LastName
      number: "23"
    }
  ],
  notes: "Great team!",
  abbreviation: "TA"
};

const response = await fetch('https://your-api.vercel.app/api/v1/exposure/teams', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(teamData)
});

const result = await response.json();
console.log('Team created:', result);
```

---

### **5. Get All Teams**
```
GET /api/v1/exposure/teams?divisionId=1000
```

**Frontend Example:**
```javascript
const response = await fetch('https://your-api.vercel.app/api/v1/exposure/teams?divisionId=1000');
const teams = await response.json();
```

---

### **6. Get Single Team**
```
GET /api/v1/exposure/teams/:teamId
```

**Frontend Example:**
```javascript
const response = await fetch('https://your-api.vercel.app/api/v1/exposure/teams/12345');
const team = await response.json();
```

---

### **7. Update Team**
```
PUT /api/v1/exposure/teams/:teamId
```

**Frontend Example:**
```javascript
const updates = {
  name: "Updated Team Name",
  paid: true,
  notes: "Payment received"
};

const response = await fetch('https://your-api.vercel.app/api/v1/exposure/teams/12345', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updates)
});

const result = await response.json();
```

---

## 🎨 Complete Frontend Flow

### Step 1: Load Events & Divisions

```javascript
// Load events
async function loadEvents() {
  const response = await fetch('https://your-api.vercel.app/api/v1/exposure/events');
  const data = await response.json();
  return data.Events.Results; // Array of events
}

// Load divisions for an event
async function loadDivisions(eventId) {
  const response = await fetch(`https://your-api.vercel.app/api/v1/exposure/divisions?eventId=${eventId}`);
  const data = await response.json();
  return data.Divisions.Results; // Array of divisions
}
```

### Step 2: Collect Team Data from Form

```javascript
// Example form submission
async function handleTeamSubmit(formData) {
  const teamData = {
    divisionId: formData.division,
    name: formData.teamName,
    gender: formData.gender,
    address: {
      city: formData.city,
      stateRegion: formData.state,
      postalCode: formData.zip
    },
    players: formData.players.map(player => ({
      firstName: player.firstName,
      lastName: player.lastName,
      number: player.jerseyNumber
    })),
    abbreviation: formData.abbreviation,
    notes: formData.notes
  };

  try {
    // Create team on Exposure Events
    const response = await fetch('https://your-api.vercel.app/api/v1/exposure/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData)
    });

    if (!response.ok) {
      throw new Error('Failed to create team');
    }

    const result = await response.json();
    console.log('Team created successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
}
```

### Step 3: Create Payment Session

```javascript
// After team is created, handle payment
async function handlePayment(teamId, teamName) {
  const response = await fetch('https://your-api.vercel.app/api/v1/payments/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamId: teamId,
      teamName: teamName,
      successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: window.location.href
    })
  });

  const { url } = await response.json();
  
  // Redirect to Stripe checkout
  window.location.href = url;
}
```

### Step 4: Update Team After Payment

```javascript
// After successful payment, update team status
async function markTeamAsPaid(teamId, sessionId) {
  // Verify payment first
  const verifyResponse = await fetch(`https://your-api.vercel.app/api/v1/payments/verify/${sessionId}`);
  const verification = await verifyResponse.json();

  if (verification.verified) {
    // Update team as paid on Exposure Events
    const response = await fetch(`https://your-api.vercel.app/api/v1/exposure/teams/${teamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paid: true,
        status: 1
      })
    });

    return await response.json();
  }
}
```

### Step 5: Load Teams

```javascript
// Load teams for display
async function loadTeams(divisionId) {
  const response = await fetch(`https://your-api.vercel.app/api/v1/exposure/teams?divisionId=${divisionId}`);
  const data = await response.json();
  return data.Teams.Results; // Array of teams
}

// Display teams
async function displayTeams(divisionId) {
  const teams = await loadTeams(divisionId);
  
  teams.forEach(team => {
    console.log(`${team.Name} - ${team.Paid ? 'Paid' : 'Unpaid'}`);
  });
}
```

---

## 🔄 Complete Registration Flow

```javascript
class TeamRegistration {
  constructor(apiBaseUrl) {
    this.apiUrl = apiBaseUrl;
  }

  async registerTeam(teamData) {
    try {
      // 1. Create team on Exposure Events
      console.log('Creating team...');
      const createResponse = await fetch(`${this.apiUrl}/api/v1/exposure/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
      
      const team = await createResponse.json();
      const teamId = team.Team.Id;
      console.log('Team created with ID:', teamId);

      // 2. Create payment session
      console.log('Creating payment session...');
      const paymentResponse = await fetch(`${this.apiUrl}/api/v1/payments/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: teamId.toString(),
          teamName: team.Team.Name,
          successUrl: `${window.location.origin}/payment-success?teamId=${teamId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href
        })
      });

      const payment = await paymentResponse.json();
      
      // 3. Redirect to payment
      console.log('Redirecting to payment...');
      window.location.href = payment.url;
      
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async completeRegistration(teamId, sessionId) {
    // Verify payment
    const verifyResponse = await fetch(`${this.apiUrl}/api/v1/payments/verify/${sessionId}`);
    const verification = await verifyResponse.json();

    if (verification.verified) {
      // Mark team as paid
      await fetch(`${this.apiUrl}/api/v1/exposure/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: true })
      });

      return { success: true };
    }

    return { success: false };
  }
}

// Usage
const registration = new TeamRegistration('https://your-api.vercel.app');

// On form submit
await registration.registerTeam({
  divisionId: 1000,
  name: "My Team",
  // ... other data
});

// On success page
const urlParams = new URLSearchParams(window.location.search);
const teamId = urlParams.get('teamId');
const sessionId = urlParams.get('session_id');

await registration.completeRegistration(teamId, sessionId);
```

---

## 📊 Data Format Notes

Your API accepts **both** camelCase and PascalCase:
- ✅ `divisionId` or `DivisionId`
- ✅ `name` or `Name`
- ✅ `firstName` or `FirstName`

It automatically converts to Exposure Events format (PascalCase).

---

## 🚀 Deploy to Vercel

### Add Environment Variables in Vercel:

```
EXPOSURE_API_KEY=9bZ9A99u99999M
EXPOSURE_SECRET_KEY=E99pWXF9emeW6Bs7X659lH9vhr7aPcOE
EXPOSURE_BASE_URL=https://basketball.exposureevents.com/api/v1
```

Plus your existing Stripe keys!

---

## 🧪 Test the Integration

### Using Swagger Docs:
1. Visit: https://your-api.vercel.app/api-docs
2. Find "Exposure Integration" section
3. Try "POST /api/v1/exposure/teams"
4. Click "Try it out"
5. Execute!

### Using curl:
```bash
curl -X POST https://your-api.vercel.app/api/v1/exposure/teams \
  -H "Content-Type: application/json" \
  -d '{
    "divisionId": 1000,
    "name": "Test Team",
    "abbreviation": "TT"
  }'
```

---

## 🐛 Troubleshooting

### Error: "Failed to fetch teams"
- Check API keys are correct
- Verify Exposure Events API is accessible
- Check divisionId exists

### Error: "Team creation failed"
- Ensure divisionId and name are provided
- Check data format matches Exposure Events requirements

### Teams not showing as paid
- Verify payment webhook is working
- Manually update team status via PUT endpoint

---

## 📚 API Documentation

All endpoints are documented in Swagger UI:
https://your-api.vercel.app/api-docs

Look for the **"Exposure Integration"** section!

---

## ✅ Complete Checklist

- [ ] API deployed to Vercel
- [ ] Environment variables configured
- [ ] Test create team endpoint
- [ ] Test get teams endpoint
- [ ] Frontend integrated
- [ ] Payment flow working
- [ ] Teams marked as paid after payment

---

**You're all set! Your API now bridges your frontend with Exposure Events! 🎉**
