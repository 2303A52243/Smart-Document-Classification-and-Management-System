@echo off
title Smart Document System - Live Tunnel Runner
echo ========================================================
echo   Smart Document Classification System - Cloudflare Tunnel
echo ========================================================
echo.
echo Starting FastAPI Backend on port 8000...
start "SmartDoc-Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Cloudflare HTTPS Tunnel...
echo Look for the https://....trycloudflare.com link below!
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:8000
pause

