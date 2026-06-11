@echo off
chcp 65001 >nul 2>&1
title PlantiuIA - Instalacao

echo.
echo ==================================================
echo    PlantiuIA - Instalador de Dependencias
echo    Sistema de IA para Agricultura Inteligente
echo ==================================================
echo.

:: Ir para o diretorio do script
cd /d "%~dp0"

:: ============================================
:: [1/5] Verificar Python
:: ============================================
echo [1/5] Verificando Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Python nao encontrado!
    echo        Instale Python 3.11+ em https://python.org
    echo        Marque "Add Python to PATH" durante a instalacao.
    echo.
    pause
    exit /b 1
)
for /f "tokens=2" %%a in ('python --version 2^>^&1') do set PYVER=%%a
echo [OK] Python %PYVER% encontrado.

:: ============================================
:: [2/5] Criar ambiente virtual
:: ============================================
echo.
echo [2/5] Configurando ambiente virtual...
if not exist "venv" (
    echo       Criando venv...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao criar ambiente virtual.
        pause
        exit /b 1
    )
    echo [OK] Ambiente virtual criado.
) else (
    echo [OK] Ambiente virtual ja existe.
)

:: Ativar venv
call venv\Scripts\activate.bat
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao ativar o ambiente virtual.
    pause
    exit /b 1
)

:: ============================================
:: [3/5] Instalar dependencias Python
:: ============================================
echo.
echo [3/5] Instalando dependencias Python...
echo       Isso pode levar alguns minutos na primeira vez...
echo.

python -m pip install --upgrade pip --quiet
pip install -r backend\requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Algumas dependencias podem ter falhado.
    echo         Se llama-cpp-python falhou, instale manualmente:
    echo           pip install llama-cpp-python --prefer-binary
    echo.
    echo         O sistema pode funcionar sem o modelo local
    echo         usando apenas provedores de API ou Ollama.
    echo.
) else (
    echo [OK] Dependencias instaladas com sucesso.
)

:: ============================================
:: [4/5] Configurar .env
:: ============================================
echo.
echo [4/5] Configurando ambiente...

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] Arquivo .env criado a partir do .env.example
    ) else (
        echo       Criando .env padrao...
        (
            echo # PlantiuIA - Configuracoes
            echo # Edite este arquivo para configurar provedores de IA
            echo.
            echo # --- Modo de IA ---
            echo # Opcoes: local_only, api_only, hybrid_prefer_api, hybrid_prefer_local, smart_failover
            echo AI_MODE=smart_failover
            echo.
            echo # --- Modelo Local GGUF ---
            echo # Deixe vazio para usar qualquer .gguf em backend/models_ai/
            echo LOCAL_MODEL_PATH=
            echo LOCAL_MODEL_THREADS=0
            echo LOCAL_MODEL_CONTEXT=4096
            echo LOCAL_MODEL_GPU_LAYERS=0
            echo.
            echo # --- Ollama ^(IA local alternativa^) ---
            echo OLLAMA_BASE_URL=http://localhost:11434
            echo OLLAMA_MODEL=llama3.2-vision
            echo OLLAMA_TEXT_MODEL=llama3.2
            echo.
            echo # --- Anthropic ^(Claude^) ---
            echo ANTHROPIC_API_KEY=
            echo ANTHROPIC_MODEL=claude-sonnet-4-20250514
            echo.
            echo # --- OpenAI ---
            echo OPENAI_API_KEY=
            echo OPENAI_MODEL=gpt-4o
            echo.
            echo # --- Google Gemini ---
            echo GEMINI_API_KEY=
            echo GEMINI_MODEL=gemini-2.0-flash
            echo.
            echo # --- Servidor ---
            echo SERVER_HOST=0.0.0.0
            echo SERVER_PORT=8000
            echo DEBUG=false
        ) > .env
        echo [OK] Arquivo .env criado com valores padrao.
    )
    echo [AVISO] Edite .env para adicionar suas API keys ^(opcional^).
) else (
    echo [OK] Arquivo .env ja existe.
)

:: ============================================
:: [5/5] Baixar modelo de IA local
:: ============================================
echo.
echo [5/5] Verificando modelo de IA local...

if not exist "backend\models_ai" mkdir "backend\models_ai"
if not exist "backend\data" mkdir "backend\data"
if not exist "backend\data\uploads" mkdir "backend\data\uploads"

dir /b "backend\models_ai\*.gguf" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ==================================================
    echo    Baixando modelo de IA local ^(SmolLM3 3B^)
    echo    Tamanho: ~2GB - Suporte nativo a Portugues
    echo    Aguarde, isso pode levar alguns minutos...
    echo ==================================================
    echo.
    python -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='bartowski/HuggingFaceTB_SmolLM3-3B-GGUF', filename='HuggingFaceTB_SmolLM3-3B-Q4_K_M.gguf', local_dir='backend/models_ai', local_dir_use_symlinks=False)"
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [AVISO] Download do modelo falhou.
        echo         Voce pode baixar manualmente:
        echo           1. Acesse: https://huggingface.co/bartowski/HuggingFaceTB_SmolLM3-3B-GGUF
        echo           2. Baixe: HuggingFaceTB_SmolLM3-3B-Q4_K_M.gguf
        echo           3. Coloque em: backend\models_ai\
        echo.
        echo         O sistema funcionara usando API ^(Claude/OpenAI/Gemini^) ou Ollama.
        echo.
    ) else (
        echo [OK] Modelo de IA baixado com sucesso!
    )
) else (
    echo [OK] Modelo de IA ja existe em backend\models_ai\
)

:: ============================================
:: Finalizacao
:: ============================================
echo.
echo ==================================================
echo    Instalacao Concluida!
echo.
echo    Para iniciar o PlantiuIA, execute:
echo      iniciar.bat  ^(Windows^)
echo      ./iniciar.sh ^(Linux/Mac^)
echo ==================================================
echo.
pause
