@echo off
REM Automated setup for Brain Grain backend (Windows)

echo.
echo =======================================
echo  Brain Grain Backend Setup (Windows)
echo =======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

REM Run the setup script
node setup.js

echo.
pause
