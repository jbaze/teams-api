# Teams API

A RESTful API for managing teams, inspired by the Exposure Events API structure.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Run the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Production deployment:**
```bash
vercel --prod
```

Your API will be live at: `https://your-project.vercel.app`

### Deploy to Netlify

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify:**
```bash
netlify login
```

3. **Create `netlify.toml`:**
```toml
[build]
  functions = "api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

4. **Deploy:**
```bash
netlify deploy --prod
```

## 📚 API Endpoints

### Base URL
- Local: `http://localhost:3000`
- Production: `https://your-project.vercel.app`

### 1. GET /api/v1/teams

Retrieve all teams or a single team by ID.

**Query Parameters:**
- `id` (optional) - Get a specific team by ID
- `divisionId` (optional) - Filter teams by division
- `page` (optional, default: 1) - Page number for pagination
- `pageSize` (optional, default: 50) - Number of results per page

**Examples:**

```bash
# Get all teams
curl http://localhost:3000/api/v1/teams

# Get a specific team
curl http://localhost:3000/api/v1/teams?id=123e4567-e89b-12d3-a456-426614174000

# Get teams by division with pagination
curl http://localhost:3000/api/v1/teams?divisionId=100&page=1&pageSize=20
```

**Response (All Teams):**
```json
{
  "teams": {
    "page": 1,
    "pageSize": 50,
    "totalResults": 2,
    "results": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "divisionId": 1000,
        "name": "Team Exposure",
        "gender": 2,
        "paid": true,
        "status": 1,
        "address": {
          "city": "Louisville",
          "stateRegion": "KY",
          "postalCode": "40205"
        },
        "players": [
          {
            "externalPlayerId": "P1",
            "firstName": "Anderson",
            "lastName": "Ginkins",
            "number": "23"
          }
        ],
        "notes": "Team needs a refund",
        "website": "https://example.com",
        "twitterHandle": "exposurebball",
        "abbreviation": "TE",
        "externalTeamId": "45465gG",
        "instagramHandle": "exposurebball",
        "facebookPage": "http://facebook.com/exposurebball",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Response (Single Team):**
```json
{
  "team": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "divisionId": 1000,
    "name": "Team Exposure",
    "gender": 2,
    "paid": true,
    "status": 1,
    "address": {
      "city": "Louisville",
      "stateRegion": "KY",
      "postalCode": "40205"
    },
    "players": [],
    "notes": "",
    "website": "",
    "twitterHandle": "",
    "abbreviation": "TE",
    "externalTeamId": "",
    "instagramHandle": "",
    "facebookPage": "",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. POST /api/v1/teams

Create a new team.

**Required Fields:**
- `divisionId` (number)
- `name` (string)

**Optional Fields:**
- `gender` (number)
- `paid` (boolean, default: false)
- `status` (number, default: 1)
- `address` (object with city, stateRegion, postalCode)
- `players` (array of player objects)
- `notes` (string)
- `website` (string)
- `twitterHandle` (string)
- `abbreviation` (string)
- `externalTeamId` (string)
- `instagramHandle` (string)
- `facebookPage` (string)

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/teams \
  -H "Content-Type: application/json" \
  -d '{
    "divisionId": 1000,
    "name": "Team Exposure",
    "gender": 2,
    "paid": true,
    "status": 1,
    "address": {
      "city": "Louisville",
      "stateRegion": "KY",
      "postalCode": "40205"
    },
    "players": [
      {
        "externalPlayerId": "P1",
        "firstName": "Anderson",
        "lastName": "Ginkins",
        "number": "23"
      }
    ],
    "notes": "Team needs a refund",
    "website": "https://example.com",
    "twitterHandle": "exposurebball",
    "abbreviation": "TE",
    "externalTeamId": "45465gG",
    "instagramHandle": "exposurebball",
    "facebookPage": "http://facebook.com/exposurebball"
  }'
```

**Response:**
```json
{
  "message": "Team created successfully",
  "team": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "divisionId": 1000,
    "name": "Team Exposure",
    "gender": 2,
    "paid": true,
    "status": 1,
    "address": {
      "city": "Louisville",
      "stateRegion": "KY",
      "postalCode": "40205"
    },
    "players": [
      {
        "externalPlayerId": "P1",
        "firstName": "Anderson",
        "lastName": "Ginkins",
        "number": "23"
      }
    ],
    "notes": "Team needs a refund",
    "website": "https://example.com",
    "twitterHandle": "exposurebball",
    "abbreviation": "TE",
    "externalTeamId": "45465gG",
    "instagramHandle": "exposurebball",
    "facebookPage": "http://facebook.com/exposurebball",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. PUT /api/v1/teams

Update an existing team. Only the fields provided in the request will be updated.

**Query Parameters:**
- `id` (required) - The team ID to update

**Example:**

```bash
curl -X PUT "http://localhost:3000/api/v1/teams?id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Team Name",
    "paid": true,
    "notes": "Updated notes",
    "address": {
      "city": "New York",
      "stateRegion": "NY"
    }
  }'
```

**Response:**
```json
{
  "message": "Team updated successfully",
  "team": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "divisionId": 1000,
    "name": "Updated Team Name",
    "gender": 2,
    "paid": true,
    "status": 1,
    "address": {
      "city": "New York",
      "stateRegion": "NY",
      "postalCode": "40205"
    },
    "players": [
      {
        "externalPlayerId": "P1",
        "firstName": "Anderson",
        "lastName": "Ginkins",
        "number": "23"
      }
    ],
    "notes": "Updated notes",
    "website": "https://example.com",
    "twitterHandle": "exposurebball",
    "abbreviation": "TE",
    "externalTeamId": "45465gG",
    "instagramHandle": "exposurebball",
    "facebookPage": "http://facebook.com/exposurebball",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  }
}
```

### 4. GET /api/health

Health check endpoint to verify the API is running.

**Example:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "teamsCount": 5
}
```

## 🔒 Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "divisionId is required"
}
```

### 404 Not Found
```json
{
  "error": "Team not found",
  "message": "No team found with ID: 123"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details here"
}
```

## 💾 Data Storage

Currently, this API uses **in-memory storage** for simplicity. For production use, you should integrate a real database:

### Options:
1. **MongoDB** (with Mongoose)
2. **PostgreSQL** (with Prisma or pg)
3. **Supabase** (PostgreSQL with built-in API)
4. **Firebase Firestore**
5. **PlanetScale** (MySQL)

### Adding MongoDB Example:

```bash
npm install mongoose
```

```javascript
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  divisionId: Number,
  name: String,
  gender: Number,
  paid: Boolean,
  status: Number,
  address: {
    city: String,
    stateRegion: String,
    postalCode: String
  },
  players: Array,
  // ... other fields
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);

// Connect
mongoose.connect(process.env.MONGODB_URI);
```

## 🧪 Testing

You can test the API using the provided test script:

```bash
npm test
```

Or use tools like:
- **Postman**
- **Insomnia**
- **Thunder Client** (VS Code extension)
- **curl** (command line)

## 📝 Environment Variables

Create a `.env` file for configuration:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=your-database-url
API_KEY=your-api-key
```

## 🔑 Adding Authentication

For production, consider adding authentication:

1. **API Key Authentication**
2. **JWT Tokens**
3. **OAuth 2.0**

Example middleware:
```javascript
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

app.use('/api/v1/teams', authenticateApiKey);
```

## 📊 Features

✅ RESTful API design  
✅ CRUD operations for teams  
✅ Pagination support  
✅ Filtering by division  
✅ Partial updates (PUT only updates provided fields)  
✅ Error handling  
✅ CORS enabled  
✅ Ready for Vercel/Netlify deployment  
✅ In-memory data storage (easily replaceable with a database)

## 🚀 Next Steps

1. Add database integration
2. Implement authentication
3. Add input validation (express-validator or Joi)
4. Add rate limiting
5. Add logging (Winston or Pino)
6. Add automated tests (Jest or Mocha)
7. Add API documentation (Swagger/OpenAPI)

## 📄 License

MIT
