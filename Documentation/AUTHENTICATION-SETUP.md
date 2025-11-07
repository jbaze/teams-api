# Exposure Events Authentication Update

## What Changed

The API now authenticates with Exposure Events on server startup using username/password credentials. The API keys are automatically obtained, base64 decoded, and stored in memory.

## Setup Instructions

### Option 1: Environment Variables (Recommended for Production)

1. Create a `.env` file in the project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   EXPOSURE_USERNAME=your-actual-username
   EXPOSURE_PASSWORD=your-actual-password
   ```

3. Start the server:
   ```bash
   node server.js
   ```
   The server will automatically authenticate using the credentials from `.env`.

### Option 2: Manual Entry (Interactive Mode)

1. Simply start the server without setting environment variables:
   ```bash
   node server.js
   ```

2. You will be prompted to enter your credentials:
   ```
   Enter your Exposure Events username: 
   Enter your Exposure Events password: 
   ```

## How It Works

1. **Server Startup**: When `server.js` runs, it checks for `EXPOSURE_USERNAME` and `EXPOSURE_PASSWORD` environment variables
2. **Authentication**: Calls the Exposure Events `/authenticate` endpoint
3. **Base64 Decoding**: Automatically decodes the base64-encoded API keys from the response
4. **Key Storage**: Stores the decoded keys in memory via the `auth-manager` module
5. **API Ready**: All subsequent API calls use the decoded keys automatically

## New Endpoints

### POST /api/v1/exposure/authenticate
Manually authenticate (optional - mainly for re-authentication if needed):
```bash
curl -X POST http://localhost:3000/api/v1/exposure/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'
```

### GET /api/v1/exposure/auth-status
Check current authentication status:
```bash
curl http://localhost:3000/api/v1/exposure/auth-status
```

## Files Modified

- **`api/auth-manager.js`** (NEW): Manages authentication and stores decoded API keys
- **`api/exposure.js`**: Updated to use keys from auth-manager instead of hardcoded values
- **`server.js`**: Added authentication on startup with credential prompts
- **`.env.example`**: Updated to include `EXPOSURE_USERNAME` and `EXPOSURE_PASSWORD`

## Benefits

- ✅ No more hardcoded API keys in code
- ✅ Automatic base64 decoding
- ✅ Keys obtained fresh on each startup
- ✅ Supports both automated (env vars) and interactive (prompts) authentication
- ✅ Centralized key management
