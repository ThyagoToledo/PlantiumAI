#!/usr/bin/env bash
# ============================================
# PlantiuIA — Instalador de Dependências
# Linux / macOS
# ============================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     🌱 PlantiuIA — Instalador de Dependências   ║"
echo "║     Sistema Inteligente de IA para Agricultura   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ============================================
# Verificar Python
# ============================================
echo "[1/5] Verificando Python..."

PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python não encontrado! Instale Python 3.11+"
    echo "   Ubuntu/Debian: sudo apt install python3 python3-venv python3-pip"
    echo "   Fedora: sudo dnf install python3 python3-pip"
    echo "   macOS: brew install python"
    exit 1
fi

PYVER=$($PYTHON_CMD --version 2>&1)
echo "✅ $PYVER encontrado"

# ============================================
# Criar ambiente virtual
# ============================================
echo ""
echo "[2/5] Configurando ambiente virtual..."

if [ ! -d "venv" ]; then
    echo "   Criando venv..."
    $PYTHON_CMD -m venv venv
    echo "✅ Ambiente virtual criado"
else
    echo "✅ Ambiente virtual já existe"
fi

# Ativar venv
source venv/bin/activate

# ============================================
# Instalar dependências Python
# ============================================
echo ""
echo "[3/5] Instalando dependências Python..."
echo "   Isso pode levar alguns minutos na primeira vez..."

pip install --upgrade pip > /dev/null 2>&1
pip install -r backend/requirements.txt

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Algumas dependências podem ter falhado."
    echo "   Se llama-cpp-python falhou, tente:"
    echo "   pip install llama-cpp-python --prefer-binary"
    echo ""
fi
echo "✅ Dependências instaladas"

# ============================================
# Configurar .env
# ============================================
echo ""
echo "[4/5] Configurando ambiente..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Arquivo .env criado a partir do template"
    echo "   ⚠️  Edite .env para adicionar suas API keys (opcional)"
else
    echo "✅ Arquivo .env já existe"
fi

# ============================================
# Baixar modelo de IA local
# ============================================
echo ""
echo "[5/5] Verificando modelo de IA local..."

mkdir -p backend/models_ai

GGUF_COUNT=$(find backend/models_ai -name "*.gguf" 2>/dev/null | wc -l)

if [ "$GGUF_COUNT" -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════╗"
    echo "║  📥 Baixando modelo de IA (SmolLM3 3B)          ║"
    echo "║  Tamanho: ~2GB — Suporte nativo a Português     ║"
    echo "║  Isso pode levar alguns minutos...              ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo ""
    
    python -c "
from huggingface_hub import hf_hub_download
hf_hub_download(
    repo_id='bartowski/HuggingFaceTB_SmolLM3-3B-GGUF',
    filename='HuggingFaceTB_SmolLM3-3B-Q4_K_M.gguf',
    local_dir='backend/models_ai',
    local_dir_use_symlinks=False
)
"
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "⚠️  Download do modelo falhou. Você pode baixar manualmente:"
        echo "   1. Acesse: https://huggingface.co/bartowski/HuggingFaceTB_SmolLM3-3B-GGUF"
        echo "   2. Baixe: HuggingFaceTB_SmolLM3-3B-Q4_K_M.gguf"
        echo "   3. Coloque em: backend/models_ai/"
        echo ""
    else
        echo "✅ Modelo de IA baixado com sucesso!"
    fi
else
    echo "✅ Modelo de IA já existe em backend/models_ai/"
fi

# ============================================
# Criar diretórios necessários
# ============================================
mkdir -p backend/data/uploads

# ============================================
# Finalização
# ============================================
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Instalação Concluída!                       ║"
echo "║                                                  ║"
echo "║  Para iniciar o PlantiuIA, execute:             ║"
echo "║    iniciar.bat  (Windows)                       ║"
echo "║    ./iniciar.sh (Linux/Mac)                     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
