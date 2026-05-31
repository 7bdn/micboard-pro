@echo off
title MicBoard Pro - Auto Builder
color 0A
cls

:: ── FIX: Move to the folder where this BAT file lives ──
cd /d "%~dp0"

echo.
echo  ================================================
echo       MicBoard Pro - Auto Build
echo  ================================================
echo.
echo  Working directory: %cd%
echo.

:: Check Node.js
echo [1/6] Checking Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js not found!
    echo Please install from: https://nodejs.org (LTS version)
    pause
    start https://nodejs.org
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER%
echo.

:: Clean
echo [2/6] Cleaning old files...
if exist "node_modules" rmdir /s /q node_modules
if exist "build" rmdir /s /q build
echo [OK] Clean done
echo.

:: Install
echo [3/6] Installing dependencies...
echo This may take 5-10 minutes, please wait...
echo.
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

:: Icon
echo [4/6] Creating icon...
if not exist "assets" mkdir assets
node scripts\create-icon.js >nul 2>&1
echo [OK] Icon ready
echo.

:: React build
echo [5/6] Building UI...
set CI=false
set GENERATE_SOURCEMAP=false
call npx react-scripts build
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] React build failed!
    pause
    exit /b 1
)
echo [OK] UI built
echo.

:: EXE build
echo [6/6] Building EXE installer...
echo Please wait 3-5 minutes...
echo.
call npx electron-builder build --win --x64
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] EXE build failed!
    pause
    exit /b 1
)

:: Done
cls
color 0A
echo.
echo  ================================================
echo.
echo    BUILD SUCCESSFUL!
echo    Your EXE is ready in the  dist  folder
echo.
echo  ================================================
echo.
if exist "dist" explorer dist
pause
