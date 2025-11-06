#!/bin/bash

echo "🚀 Teams API - Quick Start Setup"
echo "================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. You have: $(node -v)"
    echo "   Please upgrade Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Start the server in background
echo "🚀 Starting the API server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Run tests
echo ""
echo "🧪 Running API tests..."
echo ""
node test-api.js

# Clean up
echo ""
echo "🛑 Stopping the server..."
kill $SERVER_PID 2>/dev/null

echo ""
echo "================================="
echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Visit http://localhost:3000/api/health to check the API"
echo "3. Read README.md for full documentation"
echo "4. Read DEPLOYMENT.md to deploy to Vercel or Netlify"
echo ""
echo "Happy coding! 🎉"
