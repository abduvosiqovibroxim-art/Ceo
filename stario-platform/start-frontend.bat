@echo off
echo ========================================
echo    Stario Platform - Frontend Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Installing Web Frontend dependencies...
cd apps\web-frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install web-frontend dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Installing Admin UI dependencies...
cd ..\admin-ui
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install admin-ui dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Starting Frontend Applications
echo ========================================
echo.
echo Web Frontend: http://localhost:4000
echo Admin Panel:  http://localhost:4001
echo.

cd ..

echo [3/4] Starting Web Frontend on port 4000...
start "Stario Web" cmd /k "cd web-frontend && npm run dev"

echo [4/4] Starting Admin UI on port 4001...
start "Stario Admin" cmd /k "cd admin-ui && npm run dev"

echo.
echo ========================================
echo    Both frontends are starting!
echo ========================================
echo.
echo Web Frontend: http://localhost:4000
echo Admin Panel:  http://localhost:4001
echo.
echo Press any key to exit this window...
pause >nul
