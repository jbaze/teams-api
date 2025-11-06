# 🚀 Quick Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Git installed
- Account on Vercel or Netlify

## Option 1: Deploy to Vercel (Recommended for Node.js)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login
```bash
vercel login
```

### Step 3: Deploy
Navigate to your project folder and run:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **teams-api** (or any name)
- In which directory is your code located? **./** (press Enter)
- Want to override the settings? **N**

### Step 4: Production Deploy
```bash
vercel --prod
```

Your API will be live at: `https://your-project.vercel.app`

### Testing Your Deployed API
```bash
curl https://your-project.vercel.app/api/health
```

---

## Option 2: Deploy to Netlify

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login
```bash
netlify login
```

### Step 3: Initialize and Deploy
```bash
netlify init
```

Follow the prompts to create a new site.

### Step 4: Deploy
```bash
netlify deploy --prod
```

Your API will be live at: `https://your-site.netlify.app`

---

## Option 3: Deploy via GitHub (No CLI needed)

### For Vercel:
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Click "Deploy"

### For Netlify:
1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Build settings (should auto-detect):
   - Build command: Leave empty
   - Publish directory: `public`
   - Functions directory: `api`
6. Click "Deploy"

---

## Testing Your API

### Using curl:
```bash
# Health check
curl https://your-api-url.vercel.app/api/health

# Create a team
curl -X POST https://your-api-url.vercel.app/api/v1/teams \
  -H "Content-Type: application/json" \
  -d '{
    "divisionId": 1000,
    "name": "Test Team",
    "abbreviation": "TT"
  }'

# Get all teams
curl https://your-api-url.vercel.app/api/v1/teams
```

### Using Postman:
1. Import the `postman-collection.json` file
2. Update the `{{baseUrl}}` variable to your deployed URL
3. Run the requests

---

## Common Issues

### Issue: "Module not found"
**Solution:** Make sure all dependencies are in `package.json` and run `npm install`

### Issue: "Function timeout"
**Solution:** 
- Vercel free tier: 10s timeout
- Netlify free tier: 10s timeout
- For longer operations, upgrade your plan or optimize your code

### Issue: "Cannot connect to database"
**Solution:** 
- Make sure your database is accessible from the internet
- Add your database URL to environment variables in Vercel/Netlify dashboard

---

## Adding Environment Variables

### Vercel:
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add your variables
4. Redeploy

### Netlify:
1. Go to your site dashboard
2. Site settings → Build & deploy → Environment
3. Add your variables
4. Redeploy

---

## Monitoring Your API

### Vercel:
- Dashboard shows logs and analytics
- Real-time logs: `vercel logs`

### Netlify:
- Dashboard shows function logs
- Real-time logs: `netlify functions:log`

---

## Next Steps

1. ✅ Deploy your API
2. ✅ Test all endpoints
3. 🔄 Add a real database (MongoDB, PostgreSQL, etc.)
4. 🔒 Add authentication
5. 📊 Add monitoring and logging
6. 📝 Set up custom domain

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Node.js Docs: https://nodejs.org/docs

Good luck with your deployment! 🚀
