"""
PlantiuIA — AI Gateway
Orquestrador central que roteia requisições entre provedores de IA
com failover inteligente, circuit breaker e múltiplos modos de operação.
"""

import asyncio
import time
from loguru import logger

from config import settings, AIMode
from core.circuit_breaker import CircuitBreaker
from providers.base_provider import BaseProvider, AIResponse
from providers.local_model_provider import LocalModelProvider
from providers.ollama_provider import OllamaProvider
from providers.claude_provider import ClaudeProvider
from providers.openai_provider import OpenAIProvider
from providers.gemini_provider import GeminiProvider
from providers.blackbox_provider import BlackboxProvider
from providers.minimax_provider import MinimaxProvider


class AIGateway:
    """
    Gateway unificado de IA com failover inteligente.
    
    Modos de operação:
    - local_only: Apenas Ollama (IA local)
    - api_only: Apenas provedores de API na nuvem
    - hybrid_prefer_api: API primeiro, local como fallback
    - hybrid_prefer_local: Local primeiro, API para tarefas complexas
    - smart_failover: Circuit breaker automático
    """

    def __init__(self):
        self.mode = settings.ai_mode
        self.providers: dict[str, BaseProvider] = {}
        self.circuit_breakers: dict[str, CircuitBreaker] = {}

        # Métricas
        self._total_requests = 0
        self._successful_requests = 0
        self._failover_count = 0
        self._request_history: list[dict] = []

        self._initialize_providers()

    def _initialize_providers(self):
        """Inicializa todos os provedores configurados."""
        # Modelo Local GGUF (prioridade)
        local_model_path = settings.resolved_local_model_path
        if local_model_path:
            local = LocalModelProvider(
                model_path=local_model_path,
                n_ctx=settings.local_model_context,
                n_threads=settings.local_model_threads,
                n_gpu_layers=settings.local_model_gpu_layers,
            )
            self.providers["local_model"] = local
            self.circuit_breakers["local_model"] = CircuitBreaker(
                name="local_model",
                failure_threshold=settings.cb_failure_threshold,
                recovery_timeout=settings.cb_recovery_timeout,
            )
            logger.info(f"✅ Modelo local GGUF configurado: {local_model_path}")
        else:
            logger.warning("⚠️ Modelo local GGUF não encontrado em backend/models_ai/")

        # Ollama (alternativa local)
        ollama = OllamaProvider(
            base_url=settings.ollama_base_url,
            model=settings.ollama_model,
            text_model=settings.ollama_text_model,
        )
        self.providers["ollama"] = ollama
        self.circuit_breakers["ollama"] = CircuitBreaker(
            name="ollama",
            failure_threshold=settings.cb_failure_threshold,
            recovery_timeout=settings.cb_recovery_timeout,
        )

        # Provedores de API
        if settings.anthropic_api_key:
            claude = ClaudeProvider(
                api_key=settings.anthropic_api_key,
                model=settings.anthropic_model,
            )
            self.providers["claude"] = claude
            self.circuit_breakers["claude"] = CircuitBreaker(
                name="claude",
                failure_threshold=settings.cb_failure_threshold,
                recovery_timeout=settings.cb_recovery_timeout,
            )
            logger.info("✅ Provedor Claude configurado")

        if settings.openai_api_key:
            openai_prov = OpenAIProvider(
                api_key=settings.openai_api_key,
                model=settings.openai_model,
            )
            self.providers["openai"] = openai_prov
            self.circuit_breakers["openai"] = CircuitBreaker(
                name="openai",
                failure_threshold=settings.cb_failure_threshold,
                recovery_timeout=settings.cb_recovery_timeout,
            )
            logger.info("✅ Provedor OpenAI configurado")

        if settings.gemini_api_key:
            gemini = GeminiProvider(
                api_key=settings.gemini_api_key,
                model=settings.gemini_model,
            )
            self.providers["gemini"] = gemini
            self.circuit_breakers["gemini"] = CircuitBreaker(
                name="gemini",
                failure_threshold=settings.cb_failure_threshold,
                recovery_timeout=settings.cb_recovery_timeout,
            )
            logger.info("✅ Provedor Gemini configurado")

        if settings.blackbox_api_key:
            blackbox = BlackboxProvider(
                api_key=settings.blackbox_api_key,
                model=settings.blackbox_model,
            )
            self.providers["blackbox"] = blackbox
            self.circuit_breakers["blackbox"] = CircuitBreaker(
                name="blackbox",
                failure_threshold=settings.cb_failure_threshold,
                recovery_timeout=settings.cb_recovery_timeout,
            )
            logger.info("✅ Provedor BlackBox AI configurado")

        if settings.minimax_api_key:
            minimax = MinimaxProvider(
                api_key=settings.minimax_api_key,
                model=settings.minimax_model,
            )
            self.providers["minimax"] = minimax
            self.circuit_breakers["minimax"] = CircuitBreaker(
                name="minimax",
                failure_threshold=settings.cb_failure_threshold,
                recovery_timeout=settings.cb_recovery_timeout,
            )
            logger.info(f"✅ Provedor MiniMax configurado ({settings.minimax_model})")

        logger.info(
            f"🧠 AI Gateway inicializado | Modo: {self.mode.value} | "
            f"Provedores: {list(self.providers.keys())}"
        )

    def _get_provider_order(self, prefer_vision: bool = False) -> list[str]:
        """
        Retorna a ordem de provedores com base no modo configurado.
        Respeita o circuit breaker de cada provedor.
        """
        api_providers = [k for k in self.providers if k not in ("ollama", "local_model")]
        local_providers = [k for k in ("local_model", "ollama") if k in self.providers]

        match self.mode:
            case AIMode.LOCAL_ONLY:
                order = local_providers

            case AIMode.API_ONLY:
                order = api_providers

            case AIMode.HYBRID_PREFER_API:
                order = api_providers + local_providers

            case AIMode.HYBRID_PREFER_LOCAL:
                order = local_providers + api_providers

            case AIMode.SMART_FAILOVER:
                # Prioriza local se disponível, depois API, depois Ollama
                order = ["local_model"] + api_providers + ["ollama"]
                order = [p for p in order if p in self.providers]

            case _:
                order = list(self.providers.keys())

        # Filtrar por circuit breakers disponíveis
        available = [
            name for name in order
            if name in self.circuit_breakers
            and self.circuit_breakers[name].is_available
        ]

        if not available:
            # Se todos estão em OPEN, forçar tentar todos (último recurso)
            logger.warning("⚠️ Todos os circuit breakers estão OPEN! Tentando todos os provedores...")
            available = list(self.providers.keys())

        return available

    async def analyze_image(
        self,
        image_bytes: bytes,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """
        Analisa uma imagem usando o provedor disponível com failover.
        """
        self._total_requests += 1
        provider_order = self._get_provider_order(prefer_vision=True)

        logger.info(
            f"📸 Análise de imagem | Modo: {self.mode.value} | "
            f"Ordem: {provider_order}"
        )

        last_error = None
        for provider_name in provider_order:
            provider = self.providers[provider_name]
            cb = self.circuit_breakers[provider_name]

            try:
                logger.debug(f"  → Tentando provedor: {provider_name}")
                response = await provider.analyze_image(
                    image_bytes, system_prompt, user_prompt
                )

                if response.success:
                    cb.record_success()
                    self._successful_requests += 1
                    self._record_request(provider_name, True, response.latency_ms)
                    return response
                else:
                    cb.record_failure(Exception(response.error or "Resposta inválida"))
                    last_error = response.error
                    if provider_name != provider_order[-1]:
                        self._failover_count += 1
                        logger.warning(
                            f"  ↳ Failover: {provider_name} → próximo provedor"
                        )

            except Exception as e:
                cb.record_failure(e)
                last_error = str(e)
                if provider_name != provider_order[-1]:
                    self._failover_count += 1
                    logger.warning(f"  ↳ Failover: {provider_name} falhou ({e})")

        # Todos falharam
        self._record_request("none", False, 0)
        logger.error(f"🚫 Todos os provedores falharam para análise de imagem")
        return AIResponse(
            content="",
            provider="none",
            model="none",
            success=False,
            error=f"Todos os provedores falharam. Último erro: {last_error}",
        )

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        freeform: bool = False,
    ) -> AIResponse:
        """
        Chat de texto com failover.
        freeform=True: resposta em texto livre (sem forçar JSON).
        """
        self._total_requests += 1
        provider_order = self._get_provider_order()

        logger.info(
            f"💬 Chat | Modo: {self.mode.value} | Ordem: {provider_order} | freeform={freeform}"
        )

        last_error = None
        for provider_name in provider_order:
            provider = self.providers[provider_name]
            cb = self.circuit_breakers[provider_name]

            try:
                # Usar chat_freeform se disponível e solicitado
                if freeform and hasattr(provider, "chat_freeform"):
                    response = await provider.chat_freeform(system_prompt, user_prompt)
                else:
                    response = await provider.chat(system_prompt, user_prompt)

                if response.success:
                    cb.record_success()
                    self._successful_requests += 1
                    self._record_request(provider_name, True, response.latency_ms)
                    return response
                else:
                    cb.record_failure(Exception(response.error or "Resposta inválida"))
                    last_error = response.error
                    if provider_name != provider_order[-1]:
                        self._failover_count += 1
                        logger.warning(
                            f"  ↳ Failover chat: {provider_name} → próximo provedor"
                        )

            except Exception as e:
                cb.record_failure(e)
                last_error = str(e)
                if provider_name != provider_order[-1]:
                    self._failover_count += 1
                    logger.warning(f"  ↳ Failover chat: {provider_name} falhou ({e})")

        self._record_request("none", False, 0)
        return AIResponse(
            content="",
            provider="none",
            model="none",
            success=False,
            error=f"Todos os provedores falharam. Último erro: {last_error}",
        )

    def set_mode(self, mode: AIMode):
        """Altera o modo de operação em tempo de execução."""
        old_mode = self.mode
        self.mode = mode
        logger.info(f"🔄 Modo de IA alterado: {old_mode.value} → {mode.value}")

    def reset_circuit_breaker(self, provider_name: str | None = None):
        """Reset de circuit breakers (um específico ou todos)."""
        if provider_name:
            if provider_name in self.circuit_breakers:
                self.circuit_breakers[provider_name].reset()
        else:
            for cb in self.circuit_breakers.values():
                cb.reset()

    def _record_request(self, provider: str, success: bool, latency_ms: float):
        """Registra requisição no histórico (mantém últimas 100)."""
        self._request_history.append({
            "provider": provider,
            "success": success,
            "latency_ms": latency_ms,
            "timestamp": time.time(),
        })
        if len(self._request_history) > 100:
            self._request_history = self._request_history[-100:]

    def get_status(self) -> dict:
        """Retorna status completo do gateway."""
        return {
            "mode": self.mode.value,
            "providers": {
                name: {
                    **provider.get_info(),
                    "circuit_breaker": self.circuit_breakers[name].get_stats(),
                }
                for name, provider in self.providers.items()
            },
            "metrics": {
                "total_requests": self._total_requests,
                "successful_requests": self._successful_requests,
                "success_rate": (
                    round(self._successful_requests / self._total_requests * 100, 1)
                    if self._total_requests > 0
                    else 0
                ),
                "failover_count": self._failover_count,
            },
            "recent_requests": self._request_history[-10:],
        }


# Singleton global
ai_gateway = AIGateway()
