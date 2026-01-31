@echo off
echo ========================================
echo   Candango R - Sistema ERP
echo ========================================
echo.

REM Verificar se Docker está rodando
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker Desktop nao esta rodando!
    echo.
    echo Por favor, inicie o Docker Desktop e tente novamente.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker esta rodando
echo.

REM Verificar se arquivo .env existe
if not exist "backend\.env" (
    echo [AVISO] Arquivo backend\.env nao encontrado!
    echo.
    echo Por favor, configure o arquivo .env com as credenciais do Supabase.
    echo Copie backend\.env.example para backend\.env e preencha os dados.
    echo.
    pause
    exit /b 1
)

echo [OK] Arquivo .env encontrado
echo.

REM Iniciar containers
echo Iniciando containers Docker...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao iniciar containers!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Containers iniciados com sucesso!
echo.
echo Aguardando aplicacao ficar pronta...
timeout /t 15 /nobreak >nul

REM Abrir navegador
echo.
echo Abrindo navegador...
start http://localhost:3000

echo.
echo ========================================
echo   Aplicacao rodando!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo.
echo Pressione qualquer tecla para PARAR a aplicacao...
pause >nul

echo.
echo Parando containers...
docker-compose down

echo.
echo Aplicacao encerrada.
echo.
pause
