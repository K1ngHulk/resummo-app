@echo off
setlocal EnableExtensions

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"
title Resummo Local Demo Launcher

set "DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/resummo"
set "DIRECT_URL=%DATABASE_URL%"
set "JWT_SECRET=resummo-local-demo-only-change-me"
set "PRIVATE_MVP_ACCESS=true"
set "SHOW_DEMO_CREDENTIALS=false"
set "NODE_ENV=development"
set "PORT=3001"
set "CORS_ORIGIN=http://localhost:5173"

echo.
echo ========================================
echo  Resummo - entorno local de demostracion
echo ========================================
echo.
echo Este launcher usa exclusivamente PostgreSQL local en 127.0.0.1:5433.
echo No utiliza ni modifica Supabase.
echo.

where docker.exe >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Docker CLI no esta disponible en PATH.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd no esta disponible en PATH.
  pause
  exit /b 1
)

node -e "const u=new URL(process.env.DATABASE_URL); if(!['127.0.0.1','localhost'].includes(u.hostname)||u.port!=='5433'||u.pathname!=='/resummo'){console.error('[ERROR] Safety gate: DATABASE_URL no apunta al entorno local autorizado.');process.exit(1)}; console.log('[PASS] Safety gate: base local confirmada.');"
if errorlevel 1 (
  pause
  exit /b 1
)

set "BACKEND_PID="
set "FRONTEND_PID="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3001 .*LISTENING"') do set "BACKEND_PID=%%a"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING"') do set "FRONTEND_PID=%%a"

if defined BACKEND_PID (
  echo [ERROR] El puerto 3001 ya esta ocupado por PID %BACKEND_PID%.
  echo Cierra ese proceso antes de iniciar la demo local.
  pause
  exit /b 1
)

if defined FRONTEND_PID (
  echo [ERROR] El puerto 5173 ya esta ocupado por PID %FRONTEND_PID%.
  echo Cierra ese proceso antes de iniciar la demo local.
  pause
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  echo [INFO] Iniciando Docker Desktop...
  if not exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo [ERROR] Docker Desktop no fue encontrado.
    pause
    exit /b 1
  )
  start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

  for /L %%i in (1,1,60) do (
    docker info >nul 2>nul
    if not errorlevel 1 goto docker_ready
    timeout /t 2 /nobreak >nul
  )

  echo [ERROR] Docker Desktop no estuvo listo dentro del tiempo esperado.
  pause
  exit /b 1
)

:docker_ready
echo [INFO] Iniciando PostgreSQL local...
docker compose up -d postgres
if errorlevel 1 (
  echo [ERROR] No se pudo iniciar PostgreSQL local.
  pause
  exit /b 1
)

for /L %%i in (1,1,30) do (
  powershell.exe -NoProfile -Command "$ok=(Test-NetConnection -ComputerName 127.0.0.1 -Port 5433 -InformationLevel Quiet); if($ok){exit 0}else{exit 1}" >nul 2>nul
  if not errorlevel 1 goto postgres_ready
  timeout /t 1 /nobreak >nul
)

echo [ERROR] PostgreSQL local no respondio en 127.0.0.1:5433.
pause
exit /b 1

:postgres_ready
echo [INFO] Preparando Prisma Client...
call npm.cmd run db:generate
if errorlevel 1 goto setup_failed

echo [INFO] Aplicando schema solo a la base local...
call npm.cmd run db:push
if errorlevel 1 goto setup_failed

echo [INFO] Cargando usuarios y datos base locales...
call npm.cmd run db:seed
if errorlevel 1 goto setup_failed

echo [INFO] Cargando contenido Library-first de demostracion...
node scripts/load-demo-showcase-content.mjs
if errorlevel 1 goto setup_failed

echo [INFO] Iniciando API local en http://localhost:3001 ...
start "Resummo API - Local Demo" /D "%PROJECT_DIR%" cmd /k "set DATABASE_URL=%DATABASE_URL%&& set DIRECT_URL=%DIRECT_URL%&& set JWT_SECRET=%JWT_SECRET%&& set PRIVATE_MVP_ACCESS=true&& set SHOW_DEMO_CREDENTIALS=false&& set NODE_ENV=development&& set PORT=3001&& set CORS_ORIGIN=http://localhost:5173&& npm.cmd run dev:server"

echo [INFO] Iniciando frontend en http://localhost:5173 ...
start "Resummo Web - Local Demo" /D "%PROJECT_DIR%" cmd /k "npm.cmd run dev:client"

echo [INFO] Abriendo Biblioteca...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173/learning/library"

echo.
echo ========================================
echo  Resummo local listo para la demo
echo ========================================
echo.
echo Frontend:  http://localhost:5173/learning/library
echo API:       http://localhost:3001/api/health
echo Base:      PostgreSQL local 127.0.0.1:5433

echo.
echo Cierra las ventanas "Resummo API - Local Demo" y "Resummo Web - Local Demo" para detener la app.
echo El contenedor PostgreSQL conserva los datos locales entre ejecuciones.
echo.
pause
exit /b 0

:setup_failed
echo.
echo [ERROR] Fallo la preparacion del entorno local. Supabase no fue modificado.
pause
exit /b 1
