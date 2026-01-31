@echo off
echo ========================================
echo   Reconstruindo Containers
echo ========================================
echo.

echo Parando containers...
docker-compose down

echo.
echo Reconstruindo imagens...
docker-compose build --no-cache

echo.
echo Iniciando containers...
docker-compose up -d

echo.
echo [OK] Containers reconstruidos e iniciados!
echo.
echo Aguarde ~30 segundos e acesse: http://localhost:3000
echo.
pause
