#!/usr/bin/env bash
# ============================================
# PlantiuIA — Iniciar Servidor
# Linux / macOS
# ============================================

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       🌱 PlantiuIA — Agricultura Inteligente     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ============================================
# Verificar se instalação foi feita
# ============================================
if [ ! -d "venv" ]; then
    echo "❌ Ambiente virtual não encontrado!"
    echo "   Execute './instalar.sh' primeiro."
    exit 1
fi

# Ativar venv
source venv/bin/activate

# Verificar se dependências estão instaladas
python -c "import fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Dependências não instaladas!"
    echo "   Execute './instalar.sh' primeiro."
    exit 1
fi

# ============================================
# Verificar modelo de IA
# ============================================
GGUF_COUNT=$(find backend/models_ai -name "*.gguf" 2>/dev/null | wc -l)
if [ "$GGUF_COUNT" -eq 0 ]; then
    echo "⚠️  Modelo de IA local não encontrado."
    echo "   O sistema funcionará com provedores de API ou Ollama."
    echo "   Para baixar o modelo, execute './instalar.sh' novamente."
    echo ""
fi

# ============================================
# Iniciar servidor
# ============================================
echo "🚀 Iniciando servidor PlantiuIA..."
echo "   Dashboard: http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "   Pressione Ctrl+C para parar o servidor."
echo "──────────────────────────────────────────"
echo ""

# Abrir navegador automaticamente (se disponível)
(sleep 3 && {
    if command -v xdg-open &>/dev/null; then
        xdg-open "http://localhost:8000" 2>/dev/null
    elif command -v open &>/dev/null; then
        open "http://localhost:8000" 2>/dev/null
    fi
}) &

# Iniciar FastAPI
cd backend
python main.py
