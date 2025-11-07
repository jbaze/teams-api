require('dotenv').config();
const app = require('./api/index');
const authManager = require('./api/auth-manager');
const readline = require('readline');

const PORT = process.env.PORT || 3000;

// Function to prompt for credentials
function promptCredentials() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('EXPOSURE EVENTS AUTHENTICATION REQUIRED');

    rl.question('Enter your Exposure Events username: ', (username) => {
      rl.question('Enter your Exposure Events password: ', (password) => {
        rl.close();
        resolve({ username, password });
      });
    });
  });
}

// Startup function with authentication
async function startServer() {
  try {
    // Check if credentials are in environment variables
    const username = process.env.EXPOSURE_USERNAME;
    const password = process.env.EXPOSURE_PASSWORD;
    
    if (username && password) {
      console.log('Using credentials from environment variables...');
      await authManager.authenticate(username, password);
    } else {
      console.log('No credentials found in environment variables.');
      
      // Prompt for credentials
      const credentials = await promptCredentials();
      await authManager.authenticate(credentials.username, credentials.password);
    }

    // Start the server after successful authentication
    app.listen(PORT, () => {
      console.log('Teams API is running on http://localhost:' + PORT);
      console.log('API Documentation: http://localhost:' + PORT + '/api-docs');
      console.log('Main Endpoints:');
      console.log('   GET    http://localhost:' + PORT + '/api/v1/exposure/events');
      console.log('   GET    http://localhost:' + PORT + '/api/v1/exposure/teams');
      console.log('   POST   http://localhost:' + PORT + '/api/v1/exposure/teams');
      console.log('   PUT    http://localhost:' + PORT + '/api/v1/exposure/teams?id=TEAM_ID');
      console.log('   GET    http://localhost:' + PORT + '/api/v1/exposure/auth-status');
      console.log('   GET    http://localhost:' + PORT + '/api/health');
      console.log('Authenticated and ready to accept requests!');
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error('Please check your credentials and try again.');
    process.exit(1);
  }
}

// Start the server
startServer();
