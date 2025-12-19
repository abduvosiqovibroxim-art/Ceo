@echo off
echo ========================================
echo    Starting All Services - Ceo Project
echo ========================================
echo.

cd /d "D:\Ibrokhim projects\Ceo"

echo [1/4] Starting Docker services (Stario Platform)...
cd stario-platform
docker-compose up -d
cd ..
echo      Docker services started!
echo.

echo [2/4] Starting YOLO Detection API (port 8002)...
start "YOLO API" cmd /k "cd /d \"D:\Ibrokhim projects\Ceo\yolo-detection-api\" && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload"
timeout /t 3 /nobreak > nul
echo      YOLO API started!
echo.

echo [3/4] Starting Face Quiz Backend (port 8003)...
start "Face Quiz Backend" cmd /k "cd /d \"D:\Ibrokhim projects\Ceo\face-quiz\backend\" && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload"
timeout /t 3 /nobreak > nul
echo      Face Quiz Backend started!
echo.

echo [4/4] Starting Face Quiz Frontend (port 4567)...
start "Face Quiz Frontend" cmd /k "cd /d \"D:\Ibrokhim projects\Ceo\face-quiz\frontend\" && npm run dev"
timeout /t 3 /nobreak > nul
echo      Face Quiz Frontend started!
echo.

echo ========================================
echo    All Services Started!
echo ========================================
echo.
echo Docker (Stario Platform):
echo   - Web Frontend:    http://localhost:4001
echo   - API Gateway:     http://localhost:8000
echo   - Grafana:         http://localhost:4100
echo   - MinIO Console:   http://localhost:9001
echo   - Prometheus:      http://localhost:9090
echo.
echo Local Services:
echo   - Face Quiz:       http://localhost:4567
echo   - Face Quiz API:   http://localhost:8003
echo   - YOLO API:        http://localhost:8002
echo.
echo Press any key to exit...
pause > nul
