"""
PlantiuIA — Rotas de Configurações
"""

from fastapi import APIRouter
from loguru import logger

from config import settings, AIMode
from core.ai_gateway import ai_gateway
from models.schemas import AISettingsUpdate, AIStatusResponse

router = APIRouter()


@router.get("/ai/status", response_model=AIStatusResponse)
async def get_ai_status():
    """Retorna status detalhado de todos os provedores de IA."""
    status = ai_gateway.get_status()
    return AIStatusResponse(**status)


@router.put("/ai/mode")
async def set_ai_mode(mode: str):
    """Altera o modo de operação da IA."""
    try:
        new_mode = AIMode(mode)
    except ValueError:
        return {
            "error": f"Modo inválido. Use: {[m.value for m in AIMode]}"
        }

    ai_gateway.set_mode(new_mode)
    return {
        "message": f"Modo alterado para: {new_mode.value}",
        "mode": new_mode.value,
    }


@router.post("/ai/reset-circuit-breaker")
async def reset_circuit_breaker(provider: str = None):
    """Reset de circuit breakers."""
    ai_gateway.reset_circuit_breaker(provider)
    return {
        "message": f"Circuit breaker resetado: {provider or 'todos'}",
    }


@router.get("/ai/providers")
async def list_providers():
    """Lista todos os provedores configurados e seu status."""
    status = ai_gateway.get_status()
    return {
        "mode": status["mode"],
        "providers": status["providers"],
    }


@router.get("/ai/modes")
async def list_ai_modes():
    """Lista todos os modos de operação disponíveis."""
    return {
        "modes": [
            {
                "value": mode.value,
                "description": {
                    "local_only": "Apenas IA local (Ollama). Sem dependência de internet.",
                    "api_only": "Apenas API na nuvem (Claude/GPT/Gemini).",
                    "hybrid_prefer_api": "Prioriza API, fallback para local.",
                    "hybrid_prefer_local": "Prioriza local, API para tarefas complexas.",
                    "smart_failover": "Circuit breaker automático entre provedores.",
                }[mode.value],
            }
            for mode in AIMode
        ],
        "current": settings.ai_mode.value,
    }
