@echo off
setlocal

title Resummo Launcher
cd /d "%~dp0"

echo.
echo ========================================
echo  Resummo - launcher local
echo ========================================
echo.

if not exist ".env" (
  echo [ERROR] No se encontro .env en:
  echo %CD%\.env
  echo.
  echo Crea el archivo .env antes de iniciar Resummo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] node_modules no existe. Instalando dependencias...
  npm.cmd install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install fallo.
    pause
    exit /b 1
  )
)

echo [INFO] Revisando puertos requeridos...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3001 .*LISTENING"') do set BACKEND_PID=%%a
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING"') do set FRONTEND_PID=%%a

if defined BACKEND_PID (
  echo [ERROR] El puerto 3001 ya esta ocupado por PID %BACKEND_PID%.
  echo Cierra ese proceso antes de lanzar Resummo.
  echo.
  echo Comando opcional:
  echo taskkill /PID %BACKEND_PID% /F
  pause
  exit /b 1
)

if defined FRONTEND_PID (
  echo [ERROR] El puerto 5173 ya esta ocupado por PID %FRONTEND_PID%.
  echo Cierra ese proceso antes de lanzar Resummo.
  echo.
  echo Comando opcional:
  echo taskkill /PID %FRONTEND_PID% /F
  pause
  exit /b 1
)

echo [INFO] Generando Prisma Client...
npm.cmd run db:generate
if errorlevel 1 (
  echo.
  echo [ERROR] Prisma generate fallo.
  pause
  exit /b 1
)

echo.
echo [INFO] Iniciando backend en http://localhost:3001 ...
start "Resummo API" cmd /k "cd /d ""%CD%"" && set ""PRIVATE_MVP_ACCESS=true"" && set ""SHOW_DEMO_CREDENTIALS=false"" && set ""NODE_ENV=production"" && set ""CORS_ORIGIN=http://localhost:5173"" && npm.cmd run dev:server"

echo [INFO] Iniciando frontend en http://localhost:5173 ...
start "Resummo Web" cmd /k "cd /d ""%CD%"" && npm.cmd run dev:client"

echo [INFO] Abriendo navegador en unos segundos...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo  Resummo iniciado
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Usuarios seed:
echo   Admin:   admin@resummo.app / Admin12345
echo   Editor:  editor@resummo.app / Editor12345
echo   Student: demo@resummo.app / Demo12345
echo.
echo Para detener Resummo, cierra las dos ventanas abiertas:
echo   - Resummo API
echo   - Resummo Web
echo.
pause
