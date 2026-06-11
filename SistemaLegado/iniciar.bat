@echo off
chcp 65001 >nul 2>&1
title PlantiuIA - Servidor

echo.
echo ==================================================
echo    PlantiuIA - Agricultura Inteligente com IA
echo ==================================================
echo.

:: Ir para o diretorio do script (caso seja chamado de outro local)
cd /d "%~dp0"

:: ============================================
:: Verificar se instalacao foi feita
:: ============================================
if not exist "venv" (
    echo [ERRO] Ambiente virtual nao encontrado!
    echo        Execute 'instalar.bat' primeiro.
    echo.
    pause
    exit /b 1
)

:: Ativar venv
call venv\Scripts\activate.bat
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao ativar o ambiente virtual.
    echo        Tente executar 'instalar.bat' novamente.
    echo.
    pause
    exit /b 1
)

:: Verificar se dependencias estao instaladas
python -c "import fastapi" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Dependencias nao instaladas!
    echo        Execute 'instalar.bat' primeiro.
    echo.
    pause
    exit /b 1
)

:: ============================================
:: Verificar modelo de IA local
:: ============================================
dir /b "backend\models_ai\*.gguf" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] Modelo de IA local nao encontrado.
    echo         O sistema usara provedores de API ou Ollama como fallback.
    echo         Para baixar o modelo, execute 'instalar.bat' novamente.
    echo.
) else (
    echo [OK] Modelo de IA local encontrado.
    echo.
)

:: Verificar se .env existe
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado.
    echo         Copiando de .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] .env criado. Edite-o para adicionar suas API keys.
    ) else (
        echo [AVISO] .env.example tambem nao encontrado. Execute 'instalar.bat'.
    )
    echo.
)

:: ============================================
:: Criar diretorios necessarios
:: ============================================
if not exist "backend\data" mkdir "backend\data"
if not exist "backend\data\uploads" mkdir "backend\data\uploads"
if not exist "backend\models_ai" mkdir "backend\models_ai"

:: ============================================
:: Iniciar servidor
:: ============================================
echo --------------------------------------------------
echo   Iniciando servidor PlantiuIA...
echo   Dashboard : http://localhost:8000
echo   API Docs  : http://localhost:8000/docs
echo   Pressione Ctrl+C para parar o servidor.
echo --------------------------------------------------
echo.

:: Abrir navegador apos 3 segundos (em segundo plano)
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8000"

:: Iniciar FastAPI
cd backend
python main.py
cd ..

echo.
echo [INFO] Servidor encerrado.
pause
