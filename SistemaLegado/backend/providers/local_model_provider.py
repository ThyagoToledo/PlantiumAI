"""
PlantiuIA — Local Model Provider (IA Local Própria)
Provider que usa llama-cpp-python para inferência direta de modelos GGUF.
Não depende de Ollama ou qualquer software externo.
"""

import base64
import time
import os
from pathlib import Path
from loguru import logger
from providers.base_provider import BaseProvider, AIResponse

# Lazy import para não falhar se llama-cpp-python não estiver instalado
_llm_instance = None
_llm_lock = None


def _get_lock():
    """Retorna um lock thread-safe para acesso ao modelo."""
    global _llm_lock
    if _llm_lock is None:
        import threading
        _llm_lock = threading.Lock()
    return _llm_lock


class LocalModelProvider(BaseProvider):
    """
    Provider de IA local usando llama-cpp-python.
    Carrega modelo GGUF diretamente sem precisar do Ollama.
    
    Modelo padrão: SmolLM3-3B (GGUF Q4_K_M)
    - Suporte nativo a Português
    - ~2GB de tamanho
    - Roda em CPU sem GPU
    """

    name = "local_model"

    def __init__(
        self,
        model_path: str = "",
        n_ctx: int = 4096,
        n_threads: int = 0,
        n_gpu_layers: int = 0,
    ):
        self.model_path = model_path
        self.n_ctx = n_ctx
        self.n_threads = n_threads or max(1, (os.cpu_count() or 4) // 2)
        self.n_gpu_layers = n_gpu_layers
        self._model = None
        self._model_loaded = False
        self._load_error = None

    def _ensure_model(self):
        """Carrega o modelo GGUF se ainda não foi carregado (lazy loading)."""
        global _llm_instance

        if self._model is not None:
            return True

        # Reusar instância global (singleton)
        if _llm_instance is not None:
            self._model = _llm_instance
            self._model_loaded = True
            return True

        if not self.model_path or not Path(self.model_path).exists():
            self._load_error = f"Modelo não encontrado em: {self.model_path}"
            logger.error(f"❌ LocalModel: {self._load_error}")
            return False

        lock = _get_lock()
        with lock:
            # Double-check após adquirir o lock
            if _llm_instance is not None:
                self._model = _llm_instance
                self._model_loaded = True
                return True

            try:
                from llama_cpp import Llama

                logger.info(f"🧠 Carregando modelo local: {Path(self.model_path).name}")
                logger.info(f"   Threads: {self.n_threads} | Contexto: {self.n_ctx} | GPU Layers: {self.n_gpu_layers}")

                start = time.time()
                self._model = Llama(
                    model_path=str(self.model_path),
                    n_ctx=self.n_ctx,
                    n_threads=self.n_threads,
                    n_gpu_layers=self.n_gpu_layers,
                    verbose=False,
                    chat_format="chatml",
                )
                elapsed = time.time() - start
                _llm_instance = self._model
                self._model_loaded = True

                logger.info(f"✅ Modelo local carregado em {elapsed:.1f}s")
                return True

            except ImportError:
                self._load_error = (
                    "llama-cpp-python não instalado. "
                    "Execute: pip install llama-cpp-python"
                )
                logger.error(f"❌ {self._load_error}")
                return False
            except Exception as e:
                self._load_error = f"Erro ao carregar modelo: {str(e)}"
                logger.error(f"❌ {self._load_error}")
                return False

    async def analyze_image(
        self,
        image_bytes: bytes,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """
        Analisa uma imagem usando o modelo local.
        
        Como o SmolLM3 3B é um modelo de texto (sem vision), 
        a análise é feita via prompt detalhado descrevendo o contexto.
        Para análise visual real, use um provider com suporte a vision (Ollama/API).
        """
        start_time = time.time()

        if not self._ensure_model():
            return AIResponse(
                content="",
                provider=self.name,
                model=Path(self.model_path).name if self.model_path else "none",
                success=False,
                error=self._load_error or "Modelo não disponível",
                latency_ms=(time.time() - start_time) * 1000,
            )

        # Adaptar o prompt para análise sem visão
        adapted_prompt = (
            "NOTA: Você não pode ver a imagem diretamente, mas o usuário enviou uma foto "
            "para análise. Com base no contexto fornecido abaixo, forneça a melhor "
            "análise possível usando seu conhecimento agronômico.\n\n"
            f"{user_prompt}\n\n"
            "Responda em formato JSON conforme o schema solicitado."
        )

        try:
            try:
                response = self._model.create_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": adapted_prompt},
                    ],
                    temperature=0.3,
                    max_tokens=2048,
                    response_format={"type": "json_object"},
                )
            except Exception:
                # Fallback: alguns modelos não suportam response_format
                logger.warning("⚠️ LocalModel: response_format não suportado, tentando sem formato forçado")
                response = self._model.create_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": adapted_prompt},
                    ],
                    temperature=0.3,
                    max_tokens=2048,
                )

            content = response["choices"][0]["message"]["content"]
            latency = (time.time() - start_time) * 1000
            tokens = response.get("usage", {}).get("total_tokens", 0)

            logger.info(
                f"🤖 LocalModel: Análise concluída em {latency:.0f}ms "
                f"({tokens} tokens)"
            )

            return AIResponse(
                content=content,
                provider=self.name,
                model=Path(self.model_path).name,
                success=True,
                latency_ms=latency,
                tokens_used=tokens,
                raw_response=response,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Erro LocalModel: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return AIResponse(
                content="",
                provider=self.name,
                model=Path(self.model_path).name if self.model_path else "none",
                success=False,
                error=error_msg,
                latency_ms=latency,
            )

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Chat de texto usando modelo local GGUF."""
        start_time = time.time()

        if not self._ensure_model():
            return AIResponse(
                content="",
                provider=self.name,
                model=Path(self.model_path).name if self.model_path else "none",
                success=False,
                error=self._load_error or "Modelo não disponível",
                latency_ms=(time.time() - start_time) * 1000,
            )

        try:
            try:
                response = self._model.create_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.3,
                    max_tokens=2048,
                    response_format={"type": "json_object"},
                )
            except Exception:
                # Fallback: alguns modelos não suportam response_format
                logger.warning("⚠️ LocalModel: response_format não suportado, tentando sem formato forçado")
                response = self._model.create_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.3,
                    max_tokens=2048,
                )

            content = response["choices"][0]["message"]["content"]
            latency = (time.time() - start_time) * 1000
            tokens = response.get("usage", {}).get("total_tokens", 0)

            logger.info(
                f"🤖 LocalModel: Chat concluído em {latency:.0f}ms "
                f"({tokens} tokens)"
            )

            return AIResponse(
                content=content,
                provider=self.name,
                model=Path(self.model_path).name,
                success=True,
                latency_ms=latency,
                tokens_used=tokens,
                raw_response=response,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Erro LocalModel: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return AIResponse(
                content="",
                provider=self.name,
                model=Path(self.model_path).name if self.model_path else "none",
                success=False,
                error=error_msg,
                latency_ms=latency,
            )

    async def chat_freeform(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """
        Chat de texto livre (sem forçar JSON).
        Usado para consultas gerais ao assistente agrícola.
        """
        start_time = time.time()

        if not self._ensure_model():
            return AIResponse(
                content="",
                provider=self.name,
                model=Path(self.model_path).name if self.model_path else "none",
                success=False,
                error=self._load_error or "Modelo não disponível",
                latency_ms=(time.time() - start_time) * 1000,
            )

        try:
            response = self._model.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.5,
                max_tokens=2048,
            )

            content = response["choices"][0]["message"]["content"]
            latency = (time.time() - start_time) * 1000
            tokens = response.get("usage", {}).get("total_tokens", 0)

            return AIResponse(
                content=content,
                provider=self.name,
                model=Path(self.model_path).name,
                success=True,
                latency_ms=latency,
                tokens_used=tokens,
                raw_response=response,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            return AIResponse(
                content="",
                provider=self.name,
                model=Path(self.model_path).name if self.model_path else "none",
                success=False,
                error=f"Erro LocalModel: {str(e)}",
                latency_ms=latency,
            )

    async def is_available(self) -> bool:
        """Verifica se o modelo local está disponível."""
        if self._model is not None:
            return True
        if not self.model_path:
            return False
        return Path(self.model_path).exists()

    def get_info(self) -> dict:
        model_name = Path(self.model_path).name if self.model_path else "não configurado"
        model_exists = Path(self.model_path).exists() if self.model_path else False
        return {
            "name": self.name,
            "type": "local_gguf",
            "model_file": model_name,
            "model_exists": model_exists,
            "model_loaded": self._model_loaded,
            "n_ctx": self.n_ctx,
            "n_threads": self.n_threads,
            "error": self._load_error,
        }
