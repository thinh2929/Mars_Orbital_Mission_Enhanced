@echo off
cd /d "%~dp0"
echo ===================================================
echo   MARS ORBITAL MISSION - NEXT.JS SIMULATOR
echo ===================================================
echo Starting Next.js development server...
start http://localhost:3000
npm run dev
