@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ============================================================
rem Resummo Local Import Launcher
rem - Local PostgreSQL only; never uses Supabase
rem - Backup before schema changes
rem - Prisma generate + db push against local DB only
rem - NO automatic seed and NO demo showcase load
rem - Starts API/frontend and opens Admin -> Importar contenido
rem - --restore-latest restores only this local Docker database
rem ============================================================

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"
title Resummo Local Import

set "DB_CONTAINER=resummo-local-demo-db"
set "DB_VOLUME=resummo-local-demo-data"
set "BACKUP_DIR=%PROJECT_DIR%backups\local-import"
set "ASSET_DIR=%PROJECT_DIR%.runtime\content-assets"
set "BACKUP_KEEP=10"
set "DB_PORT="
set "BACKEND_PORT="
set "FRONTEND_PORT="
set "LAST_BACKUP=No creado"
set "RESTORE_MODE=false"
set "CHECK_ONLY=false"
set "PREVIEW_ZIP=false"
set "IMPORT_ZIP=false"
set "SMOKE_NOTION_HTTP=false"
set "RESET_EDITORIAL=false"
set "QA_START=false"
set "ZIP_PATH="
if /I "%~1"=="--restore-latest" set "RESTORE_MODE=true"
if /I "%~1"=="--check-only" set "CHECK_ONLY=true"
if /I "%~1"=="--preview-zip" (
  set "PREVIEW_ZIP=true"
  set "ZIP_PATH=%~2"
)
if /I "%~1"=="--import-zip" (
  set "IMPORT_ZIP=true"
  set "ZIP_PATH=%~2"
)
if /I "%~1"=="--smoke-notion-http" set "SMOKE_NOTION_HTTP=true"
if /I "%~1"=="--reset-editorial" set "RESET_EDITORIAL=true"
if /I "%~1"=="--qa-start" set "QA_START=true"

set "JWT_SECRET=resummo-local-import-only-change-me"
set "PRIVATE_MVP_ACCESS=true"
set "SHOW_DEMO_CREDENTIALS=false"
set "NODE_ENV=development"

echo.
echo ============================================================
echo  Resummo - entorno local para importacion
echo ============================================================
echo.
echo Este launcher solo autoriza PostgreSQL local.
echo No ejecuta db:seed ni carga contenido showcase.
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
where node.exe >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta disponible en PATH.
  pause
  exit /b 1
)

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se pudo crear %BACKUP_DIR%.
  pause
  exit /b 1
)
if not exist "%ASSET_DIR%" mkdir "%ASSET_DIR%" >nul 2>nul

docker info >nul 2>nul
if errorlevel 1 (
  echo [INFO] Iniciando Docker Desktop...
  if not exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo [ERROR] Docker Desktop no fue encontrado.
    pause
    exit /b 1
  )
  start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  for /L %%i in (1,1,90) do (
    docker info >nul 2>nul
    if not errorlevel 1 goto docker_ready
    powershell.exe -NoProfile -Command "Start-Sleep -Seconds 2" >nul 2>nul
  )
  echo [ERROR] Docker Desktop no estuvo listo dentro del tiempo esperado.
  pause
  exit /b 1
)

:docker_ready
echo [PASS] Docker disponible.

rem Reutiliza el contenedor/volumen local existente cuando sea posible.
docker inspect "%DB_CONTAINER%" >nul 2>nul
if not errorlevel 1 (
  set "DB_RUNNING="
  for /f %%r in ('docker inspect -f "{{.State.Running}}" "%DB_CONTAINER%" 2^>nul') do set "DB_RUNNING=%%r"
  if /I not "!DB_RUNNING!"=="true" docker start "%DB_CONTAINER%" >nul 2>nul
  for /f "tokens=2 delims=:" %%p in ('docker port "%DB_CONTAINER%" 5432/tcp 2^>nul') do if not defined DB_PORT set "DB_PORT=%%p"
  if defined DB_PORT goto postgres_wait
  docker rm -f "%DB_CONTAINER%" >nul 2>nul
)

call :find_free_port 5433 5499 DB_PORT
if not defined DB_PORT (
  echo [ERROR] No se encontro puerto libre para PostgreSQL.
  pause
  exit /b 1
)

echo [INFO] Iniciando PostgreSQL en 127.0.0.1:%DB_PORT%...
docker run -d ^
  --name "%DB_CONTAINER%" ^
  --restart unless-stopped ^
  -p 127.0.0.1:%DB_PORT%:5432 ^
  -e POSTGRES_DB=resummo ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -v "%DB_VOLUME%:/var/lib/postgresql/data" ^
  postgres:16 >nul
if errorlevel 1 (
  echo [ERROR] No se pudo iniciar PostgreSQL local.
  pause
  exit /b 1
)

:postgres_wait
for /L %%i in (1,1,60) do (
  docker exec "%DB_CONTAINER%" pg_isready -U postgres -d resummo >nul 2>nul
  if not errorlevel 1 goto postgres_ready
  powershell.exe -NoProfile -Command "Start-Sleep -Seconds 1" >nul 2>nul
)
echo [ERROR] PostgreSQL local no respondio.
pause
exit /b 1

:postgres_ready
set "DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:%DB_PORT%/resummo"
set "DIRECT_URL=%DATABASE_URL%"
set "RESUMMO_DB_CONTAINER=%DB_CONTAINER%"
set "RESUMMO_BACKUP_DIR=%BACKUP_DIR%"
set "RESUMMO_CONTENT_ASSET_DIR=%ASSET_DIR%"

node -e "const u=new URL(process.env.DATABASE_URL); const ok=['127.0.0.1','localhost'].includes(u.hostname)&&u.pathname==='/resummo'; if(ok){console.log('[PASS] Safety gate: DB local confirmada.')}else{console.error('[ERROR] Safety gate DB local rechazado.');process.exit(1)}"
if errorlevel 1 (
  pause
  exit /b 1
)

if /I "%RESTORE_MODE%"=="true" (
  call :restore_latest
  exit /b !errorlevel!
)

if /I "%RESET_EDITORIAL%"=="true" (
  echo [INFO] Preparando Biblioteca vacia para una prueba manual del importador...
  call npm.cmd run db:reset-editorial -- --confirm RESET_EDITORIAL_CONTENT
  if errorlevel 1 (
    echo [ERROR] El reset editorial fue cancelado o fallo. Los usuarios no se modificaron.
    exit /b 1
  )
  echo [PASS] Contenido editorial local eliminado. Usuarios, autenticacion y roles preservados.
  echo [INFO] Los assets SHA existentes se conservan para reutilizacion segura durante el reimport.
  exit /b 0
)

call :backup_database
if errorlevel 1 (
  echo [ERROR] El backup previo fallo. No se modificara el schema.
  pause
  exit /b 1
)

echo [INFO] Generando Prisma Client...
call npm.cmd run db:generate
if errorlevel 1 goto setup_failed

echo [INFO] Aplicando schema solo a PostgreSQL local...
call npm.cmd run db:push
if errorlevel 1 goto setup_failed

echo [PASS] Schema local listo. Seed/showcase: NO ejecutados.

if /I "%SMOKE_NOTION_HTTP%"=="true" (
  call npm.cmd run smoke:notion-export-http
  exit /b !errorlevel!
)

if /I "%PREVIEW_ZIP%"=="true" (
  if not defined ZIP_PATH (
    echo [ERROR] Falta la ruta del ZIP para --preview-zip.
    exit /b 1
  )
  if not exist "%ZIP_PATH%" (
    echo [ERROR] El ZIP indicado no existe: %ZIP_PATH%
    exit /b 1
  )
  node scripts\notion-export-local-cli.mjs --preview "%ZIP_PATH%"
  exit /b !errorlevel!
)

if /I "%IMPORT_ZIP%"=="true" (
  if not defined ZIP_PATH (
    echo [ERROR] Falta la ruta del ZIP para --import-zip.
    exit /b 1
  )
  if not exist "%ZIP_PATH%" (
    echo [ERROR] El ZIP indicado no existe: %ZIP_PATH%
    exit /b 1
  )
  node scripts\notion-export-local-cli.mjs --import "%ZIP_PATH%" --replace-editorial
  exit /b !errorlevel!
)

if /I "%CHECK_ONLY%"=="true" (
  echo [PASS] Check-only completado. No se iniciaron API, frontend ni navegador.
  exit /b 0
)

call :find_free_port 3001 3099 BACKEND_PORT
if not defined BACKEND_PORT goto port_failed
call :find_free_port 5173 5299 FRONTEND_PORT
if not defined FRONTEND_PORT goto port_failed

set "PORT=%BACKEND_PORT%"
set "CORS_ORIGIN=http://localhost:%FRONTEND_PORT%"

echo [INFO] Iniciando API en http://localhost:%BACKEND_PORT% ...
powershell.exe -NoProfile -Command "Start-Process -WindowStyle Hidden -WorkingDirectory '%PROJECT_DIR%' -FilePath 'npm.cmd' -ArgumentList @('run','dev:server')" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se pudo iniciar el proceso de la API.
  exit /b 1
)

call :wait_http "http://localhost:%BACKEND_PORT%/api/health" 45
if errorlevel 1 (
  echo [ERROR] La API no respondio.
  pause
  exit /b 1
)

echo [INFO] Iniciando frontend en http://localhost:%FRONTEND_PORT% ...
set "RESUMMO_API_PROXY_TARGET=http://localhost:%BACKEND_PORT%"
powershell.exe -NoProfile -Command "Start-Process -WindowStyle Hidden -WorkingDirectory '%PROJECT_DIR%' -FilePath 'npm.cmd' -ArgumentList @('run','dev:client','--','--host','127.0.0.1','--port','%FRONTEND_PORT%','--strictPort')" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se pudo iniciar el proceso del frontend.
  exit /b 1
)

call :wait_http "http://localhost:%FRONTEND_PORT%/" 45
if errorlevel 1 (
  echo [ERROR] El frontend no respondio.
  pause
  exit /b 1
)

set "IMPORT_URL=http://localhost:%FRONTEND_PORT%/admin/import/articles"
if /I not "%QA_START%"=="true" start "" "%IMPORT_URL%"

echo.
echo ============================================================
echo  Resummo listo para importar
echo ============================================================
echo Frontend: %IMPORT_URL%
echo API:      http://localhost:%BACKEND_PORT%/api/health
echo DB:       PostgreSQL local 127.0.0.1:%DB_PORT%/resummo
echo Backup:   %LAST_BACKUP%
echo Assets:   %ASSET_DIR%
echo.
echo No se ejecuto seed ni showcase.
echo Para restaurar el backup local mas reciente:
echo   start-resummo-local-import.bat --restore-latest
echo Para vaciar solo el contenido editorial local antes de probar otro import:
echo   start-resummo-local-import.bat --reset-editorial
echo.
if /I "%QA_START%"=="true" (
  echo [PASS] QA-start completado. API y frontend quedaron activos; no se abrio navegador ni se espero teclado.
  exit /b 0
)
pause
exit /b 0

:find_free_port
set "%~3="
for /f %%p in ('powershell.exe -NoProfile -Command "$start=%~1; $end=%~2; foreach($p in $start..$end){ $busy=Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue; if(-not $busy){ Write-Output $p; break } }"') do set "%~3=%%p"
exit /b 0

:wait_http
set "WAIT_URL=%~1"
set "WAIT_SECONDS=%~2"
for /L %%i in (1,1,%WAIT_SECONDS%) do (
  powershell.exe -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri '%WAIT_URL%' -TimeoutSec 2; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){exit 0}else{exit 1} } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 exit /b 0
  powershell.exe -NoProfile -Command "Start-Sleep -Seconds 1" >nul 2>nul
)
exit /b 1

:backup_database
echo [INFO] Creando backup local antes de aplicar schema...
for /f %%t in ('powershell.exe -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "BACKUP_STAMP=%%t"
set "BACKUP_FILE=%BACKUP_DIR%\resummo-%BACKUP_STAMP%.dump"
set "CONTAINER_BACKUP=/tmp/resummo-%BACKUP_STAMP%.dump"
docker exec "%DB_CONTAINER%" pg_dump -U postgres -d resummo -Fc -f "%CONTAINER_BACKUP%" >nul 2>nul
if errorlevel 1 exit /b 1
docker cp "%DB_CONTAINER%:%CONTAINER_BACKUP%" "%BACKUP_FILE%" >nul 2>nul
set "COPY_RESULT=%ERRORLEVEL%"
docker exec "%DB_CONTAINER%" rm -f "%CONTAINER_BACKUP%" >nul 2>nul
if not "%COPY_RESULT%"=="0" exit /b 1
for %%f in ("%BACKUP_FILE%") do if %%~zf LEQ 0 exit /b 1
set "LAST_BACKUP=%BACKUP_FILE%"
powershell.exe -NoProfile -Command "$files=Get-ChildItem -LiteralPath '%BACKUP_DIR%' -Filter 'resummo-*.dump' -File | Sort-Object LastWriteTime -Descending; $files | Select-Object -Skip %BACKUP_KEEP% | Remove-Item -Force" >nul 2>nul
echo [PASS] Backup creado: %BACKUP_FILE%
exit /b 0

:restore_latest
set "LATEST_BACKUP="
for /f "usebackq delims=" %%f in (`powershell.exe -NoProfile -Command "$f=Get-ChildItem -LiteralPath '%BACKUP_DIR%' -Filter 'resummo-*.dump' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if($f){$f.FullName}"`) do set "LATEST_BACKUP=%%f"
if not defined LATEST_BACKUP (
  echo [ERROR] No hay backups locales para restaurar.
  pause
  exit /b 1
)
echo Se restaurara UNICAMENTE 127.0.0.1:%DB_PORT%/resummo desde:
echo %LATEST_BACKUP%
choice /C SN /N /M "Continuar? [S/N]: "
if errorlevel 2 exit /b 0
call :backup_database
if errorlevel 1 exit /b 1
for /f %%t in ('powershell.exe -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "RESTORE_STAMP=%%t"
set "CONTAINER_RESTORE=/tmp/resummo-restore-%RESTORE_STAMP%.dump"
docker cp "%LATEST_BACKUP%" "%DB_CONTAINER%:%CONTAINER_RESTORE%" >nul 2>nul
if errorlevel 1 exit /b 1
docker exec "%DB_CONTAINER%" pg_restore --clean --if-exists --no-owner -U postgres -d resummo "%CONTAINER_RESTORE%"
set "RESTORE_RESULT=%ERRORLEVEL%"
docker exec "%DB_CONTAINER%" rm -f "%CONTAINER_RESTORE%" >nul 2>nul
if not "%RESTORE_RESULT%"=="0" (
  echo [ERROR] La restauracion termino con errores.
  pause
  exit /b 1
)
echo [PASS] Restauracion local completada.
pause
exit /b 0

:port_failed
echo [ERROR] No se encontraron puertos libres para API/frontend.
pause
exit /b 1

:setup_failed
echo [ERROR] Fallo la preparacion del entorno local.
echo Supabase no fue modificado. Backup: %LAST_BACKUP%
pause
exit /b 1
