@echo off
echo ========================================
echo Brain Grain One - Quick Deploy Script
echo ========================================
echo.

echo Checking if Vercel CLI is installed...
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI not found. Installing...
    npm install -g vercel
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install Vercel CLI. Please install manually:
        echo npm install -g vercel
        pause
        exit /b 1
    )
)

echo.
echo Vercel CLI is ready!
echo.

echo ========================================
echo Starting deployment...
echo ========================================
echo.

vercel --prod

echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo Your Brain Grain platform is now live!
echo.
echo Share these links:
echo - Landing Page: [Your Vercel URL]/brain-grain-one.html
echo - Main Platform: [Your Vercel URL]/index.html
echo - Journey Map: [Your Vercel URL]/Brain%%20Grain%%20Journey.html
echo - Showcase: [Your Vercel URL]/Brain%%20Grain%%20Platform%%20(2).html
echo - Impact Dashboard: [Your Vercel URL]/Impact%%20Dashboard.html
echo.
echo Press any key to exit...
pause >nul
