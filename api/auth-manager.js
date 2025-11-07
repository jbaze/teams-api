/**
 * Authentication Manager for Exposure Events API
 * Handles login and stores decoded API keys
 */

class AuthManager {
  constructor() {
    this.apiKey = null;
    this.apiSecretKey = null;
    this.accountId = null;
    this.email = null;
    this.isAuthenticated = false;
  }

  /**
   * Authenticate with Exposure Events and store decoded API keys
   * @param {string} username - Event director username
   * @param {string} password - Event director password
   * @param {string} baseUrl - Base URL for authentication (default: baseball.exposureevents.com)
   * @returns {Promise<object>} Authentication result
   */
  async authenticate(username, password, baseUrl = 'https://baseball.exposureevents.com') {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    try {
      const authUrl = `${baseUrl}/api/v1/authenticate`;
      
      console.log('Authenticating with Exposure Events...');
      console.log('Username:', username);
      console.log('Auth URL:', authUrl);
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          Username: username,
          Password: password
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Authentication failed:', errorText);
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      console.log('Raw API response:', JSON.stringify(data, null, 2));
      
      // Check if API keys are base64 encoded
      // If they end with '==' or look like base64, decode them
      // Otherwise, use them directly
      const isBase64 = (str) => {
        try {
          return str && (str.includes('==') || /^[A-Za-z0-9+/]+=*$/.test(str)) && 
                 Buffer.from(str, 'base64').toString('base64') === str;
        } catch {
          return false;
        }
      };
      
      if (isBase64(data.ApiKey) && isBase64(data.ApiSecretKey)) {
        console.log('Decoding base64 API keys...');
        this.apiKey = Buffer.from(data.ApiKey, 'base64').toString('utf-8');
        this.apiSecretKey = Buffer.from(data.ApiSecretKey, 'base64').toString('utf-8');
      } else {
        console.log('API keys are already plain text, using directly...');
        this.apiKey = data.ApiKey;
        this.apiSecretKey = data.ApiSecretKey;
      }
      
      this.accountId = data.Id;
      this.email = data.Email;
      this.isAuthenticated = true;

      console.log('Authentication successful!');
      console.log('Account ID:', this.accountId);
      console.log('Email:', this.email);
      console.log('API Key:', this.apiKey);
      console.log('API Secret Key:', this.apiSecretKey);
      
      return {
        success: true,
        accountId: this.accountId,
        email: this.email,
        message: 'Authentication successful'
      };
    } catch (error) {
      this.isAuthenticated = false;
      console.error('Authentication error:', error.message);
      throw error;
    }
  }

  /**
   * Get the decoded API key
   * @returns {string|null} The decoded API key
   */
  getApiKey() {
    return this.apiKey;
  }

  /**
   * Get the decoded API secret key
   * @returns {string|null} The decoded API secret key
   */
  getApiSecretKey() {
    return this.apiSecretKey;
  }

  /**
   * Get account information
   * @returns {object} Account details
   */
  getAccountInfo() {
    return {
      accountId: this.accountId,
      email: this.email,
      isAuthenticated: this.isAuthenticated
    };
  }

  /**
   * Check if authenticated
   * @returns {boolean} Authentication status
   */
  isReady() {
    return this.isAuthenticated && this.apiKey && this.apiSecretKey;
  }

  /**
   * Clear authentication data
   */
  logout() {
    this.apiKey = null;
    this.apiSecretKey = null;
    this.accountId = null;
    this.email = null;
    this.isAuthenticated = false;
    console.log('Logged out');
  }
}

// Create a singleton instance
const authManager = new AuthManager();

module.exports = authManager;
