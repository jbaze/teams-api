@echo off
echo ========================================
echo Teams API - Quick Start Setup
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed: 
node -v
echo.

:: Install dependencies
echo [INFO] Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully!
echo.

:: Start server in background
echo [INFO] Starting the API server...
start /B npm run dev

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Run tests
echo.
echo [INFO] Running API tests...
echo.
node test-api.js

echo.
echo ========================================
echo [OK] Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Run 'npm run dev' to start the development server
echo 2. Visit http://localhost:3000/api/health to check the API
echo 3. Read README.md for full documentation
echo 4. Read DEPLOYMENT.md to deploy to Vercel or Netlify
echo.
echo Happy coding!
echo.

:: Clean up - kill node process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>nul

pause
