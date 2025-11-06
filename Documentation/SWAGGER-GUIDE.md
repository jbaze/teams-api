# 📚 Swagger API Documentation

Your Teams API now has **beautiful, interactive API documentation** powered by Swagger UI!

## 🎯 Access the Documentation

Once your server is running:

**Local:** http://localhost:3000/api-docs

**Production:** https://your-domain.vercel.app/api-docs

## ✨ Features

✅ **Interactive API Testing** - Test all endpoints directly from the browser  
✅ **Complete Documentation** - All endpoints fully documented  
✅ **Request/Response Examples** - See exactly what to send and expect  
✅ **Schema Definitions** - Complete data models  
✅ **Try It Out** - Execute real API calls from the docs  
✅ **No Authentication Required** - Easy testing in development  

## 🚀 Quick Start

### 1. Start Your Server
```bash
npm install
npm run dev
```

### 2. Open Swagger UI
Visit: http://localhost:3000/api-docs

### 3. Try the API
1. Click on any endpoint to expand it
2. Click "Try it out"
3. Fill in the parameters
4. Click "Execute"
5. See the response!

## 📖 What's Documented

### Teams API
- **GET /api/v1/teams** - List all teams or get single team
- **POST /api/v1/teams** - Create a new team
- **PUT /api/v1/teams** - Update an existing team

### Payment API
- **POST /api/v1/payments/create-checkout-session** - Create Stripe checkout
- **GET /api/v1/payments/session/{sessionId}** - Get session details
- **GET /api/v1/payments/verify/{sessionId}** - Verify payment
- **GET /api/v1/payments/team/{teamId}** - Get team payment history
- **GET /api/v1/payments/prices** - Get available prices

### Health
- **GET /api/health** - API health check

## 💡 How to Use Swagger UI

### Testing GET Requests
1. Expand the GET endpoint you want to test
2. Click "Try it out"
3. Enter any query parameters (optional)
4. Click "Execute"
5. See the response below

### Testing POST/PUT Requests
1. Expand the POST/PUT endpoint
2. Click "Try it out"
3. Edit the example JSON in the request body
4. Click "Execute"
5. See the response and created resource

### Example: Create a Team
1. Go to http://localhost:3000/api-docs
2. Find **POST /api/v1/teams**
3. Click "Try it out"
4. Edit the JSON:
```json
{
  "divisionId": 1000,
  "name": "My Test Team",
  "abbreviation": "MTT"
}
```
5. Click "Execute"
6. You'll see the created team with its new ID!

### Example: Create Payment Session
1. Find **POST /api/v1/payments/create-checkout-session**
2. Click "Try it out"
3. Edit the JSON:
```json
{
  "teamId": "team-test-123",
  "teamName": "My Test Team"
}
```
4. Click "Execute"
5. You'll get a Stripe checkout URL in the response!

## 🎨 Swagger UI Features

### Explore Schemas
- Click on "Schemas" at the bottom
- See complete data models for:
  - Team
  - CheckoutSession
  - PaymentSession
  - Error

### Filter by Tags
- Use tags to filter endpoints:
  - **Teams** - Team management
  - **Payments** - Payment processing
  - **Health** - System health

### Response Status Codes
Each endpoint shows all possible responses:
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **404** - Not Found
- **500** - Server Error

## 🔧 Customization

### Update Documentation
The Swagger docs are generated from JSDoc comments in the code.

To update documentation, edit the comments in:
- `api/index.js` - Teams endpoints
- `api/payments.js` - Payment endpoints

Example:
```javascript
/**
 * @swagger
 * /api/v1/teams:
 *   get:
 *     summary: Your summary here
 *     description: Detailed description
 *     ...
 */
```

### Add New Endpoints
When you add new endpoints, add Swagger documentation:

```javascript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: What this endpoint does
 *     tags: [YourTag]
 *     responses:
 *       200:
 *         description: Success response
 */
app.get('/api/v1/your-endpoint', (req, res) => {
  // Your code
});
```

### Change Theme
Edit `api/index.js`:

```javascript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Your Custom Title',
  customfavIcon: '/path/to/favicon.ico'
}));
```

## 🌐 Production Deployment

### Vercel/Netlify
The Swagger docs will automatically work in production!

Just visit: `https://your-domain.vercel.app/api-docs`

### Disable in Production (Optional)
If you want to disable docs in production, add this check:

```javascript
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

## 📱 Share with Others

### For Developers
Share the docs URL: `http://your-domain/api-docs`

They can:
- See all available endpoints
- Test the API interactively
- Copy example requests
- Understand data models

### For Non-Technical Users
The Swagger UI is user-friendly enough for:
- Product managers
- QA testers
- Clients
- Anyone who needs to understand the API

## 🆚 Swagger vs Postman

| Feature | Swagger UI | Postman |
|---------|-----------|---------|
| **Setup** | Zero config | Need to import |
| **Documentation** | Always up-to-date | Manual updates |
| **Testing** | In browser | Desktop app |
| **Sharing** | Just share URL | Export/Import |
| **Best For** | Quick testing & docs | Complex workflows |

**Use both!** Swagger for quick tests and documentation, Postman for complex testing scenarios.

## 🐛 Troubleshooting

### Swagger UI not loading?
- Check server is running: `npm run dev`
- Visit: http://localhost:3000/api-docs
- Check console for errors

### Documentation not updating?
- Restart the server
- Clear browser cache
- Check JSDoc comments syntax

### Endpoints not showing?
- Make sure JSDoc comments are correct
- Check `swagger.js` configuration
- Verify `apis: ['./api/*.js']` path

## 📚 Learn More

- **Swagger Specification:** https://swagger.io/specification/
- **Swagger UI:** https://swagger.io/tools/swagger-ui/
- **JSDoc Comments:** https://swagger.io/docs/specification/

## ✅ Quick Test Checklist

- [ ] Server running: `npm run dev`
- [ ] Visit http://localhost:3000/api-docs
- [ ] Swagger UI loads successfully
- [ ] All endpoints visible
- [ ] Can expand and test endpoints
- [ ] "Try it out" works
- [ ] Response shows correctly

## 🎉 You're Done!

Your API now has professional, interactive documentation that updates automatically!

**Visit:** http://localhost:3000/api-docs

Happy testing! 📚🚀
