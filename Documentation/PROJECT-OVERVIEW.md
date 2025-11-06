# 📁 Project Structure

```
teams-api/
├── api/
│   └── index.js              # Main API implementation (Express routes)
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── DEPLOYMENT.md            # Detailed deployment guide
├── README.md                # Complete API documentation
├── netlify.toml             # Netlify configuration
├── package.json             # Node.js dependencies and scripts
├── postman-collection.json  # Postman API testing collection
├── quickstart.sh            # Quick setup script (Linux/Mac)
├── quickstart.bat           # Quick setup script (Windows)
├── server.js                # Local development server
├── test-api.js              # Automated API tests
└── vercel.json              # Vercel configuration
```

## 📄 File Descriptions

### **api/index.js**
The heart of your API. Contains all the Express routes:
- GET /api/v1/teams - Retrieve teams
- POST /api/v1/teams - Create a new team  
- PUT /api/v1/teams - Update an existing team
- GET /api/health - Health check endpoint

### **package.json**
Defines your project dependencies and scripts:
- `npm run dev` - Start development server
- `npm start` - Start production server

### **server.js**
Local development server that wraps the API for testing locally.

### **vercel.json** & **netlify.toml**
Configuration files for deployment to Vercel or Netlify.

### **test-api.js**
Automated test script to verify all API endpoints work correctly.

### **postman-collection.json**
Import this into Postman for easy API testing with a GUI.

### **README.md**
Complete documentation including:
- API endpoints and examples
- Request/response formats
- Error handling
- Deployment instructions

### **DEPLOYMENT.md**
Step-by-step guide for deploying to:
- Vercel
- Netlify
- Via GitHub integration

### **quickstart.sh** / **quickstart.bat**
One-command setup scripts that:
- Check Node.js installation
- Install dependencies
- Run tests
- Verify everything works

## 🚀 Getting Started

### Option 1: Quick Start (Easiest)

**Linux/Mac:**
```bash
./quickstart.sh
```

**Windows:**
```bash
quickstart.bat
```

### Option 2: Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm run dev
```

3. Test the API:
```bash
node test-api.js
```

## 🌐 Deployment

Choose your preferred platform:

### Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

See **DEPLOYMENT.md** for detailed instructions.

## 🧪 Testing

### Using the test script:
```bash
node test-api.js
```

### Using curl:
```bash
curl http://localhost:3000/api/health
```

### Using Postman:
1. Import `postman-collection.json`
2. Update the `{{baseUrl}}` variable
3. Run the requests

## 📚 API Documentation

Full documentation is available in **README.md**, including:
- Complete endpoint reference
- Request/response examples
- Error handling
- Pagination
- Filtering

## 🔧 Customization

### Add a Database
Currently uses in-memory storage. To add a database:
1. Choose your database (MongoDB, PostgreSQL, etc.)
2. Install the database driver: `npm install mongoose` or `npm install pg`
3. Update `api/index.js` to use the database
4. Add connection string to `.env`

### Add Authentication
Add middleware to protect your endpoints:
```javascript
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

### Add More Endpoints
Follow the pattern in `api/index.js`:
```javascript
app.get('/api/v1/new-endpoint', (req, res) => {
  // Your code here
});
```

## 🆘 Need Help?

- Check **README.md** for API documentation
- Check **DEPLOYMENT.md** for deployment help
- Run `node test-api.js` to verify everything works
- Import Postman collection for easy testing

## 📝 Next Steps

1. ✅ Test locally: `npm run dev`
2. ✅ Run tests: `node test-api.js`
3. 🔄 Deploy to Vercel or Netlify
4. 💾 Add a real database
5. 🔒 Add authentication
6. 📊 Add monitoring

Happy coding! 🎉
