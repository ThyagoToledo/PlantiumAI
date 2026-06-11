"""
PlantiuIA — Ollama Provider (IA Local)
Provedor para modelos locais via Ollama (Llama Vision, etc.)
"""

import base64
import time
import httpx
from loguru import logger
from providers.base_provider import BaseProvider, AIResponse


class OllamaProvider(BaseProvider):
    """Provedor de IA local usando Ollama."""

    name = "ollama"

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.2-vision", text_model: str = "llama3.2"):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.text_model = text_model

    async def analyze_image(
        self,
        image_bytes: bytes,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Analisa imagem usando modelo vision local via Ollama."""
        start_time = time.time()

        try:
            # Converter imagem para base64
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")

            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": user_prompt,
                        "images": [image_b64],
                    },
                ],
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.3,
                    "num_predict": 2048,
                },
            }

            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )
                response.raise_for_status()

            data = response.json()
            content = data.get("message", {}).get("content", "")
            latency = (time.time() - start_time) * 1000

            logger.info(f"🤖 Ollama [{self.model}]: Análise de imagem concluída em {latency:.0f}ms")

            return AIResponse(
                content=content,
                provider=self.name,
                model=self.model,
                success=True,
                latency_ms=latency,
                tokens_used=data.get("eval_count", 0),
                raw_response=data,
            )

        except httpx.ConnectError as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Ollama não está rodando em {self.base_url}"
            logger.error(f"❌ Ollama: {error_msg}")
            return AIResponse(
                content="",
                provider=self.name,
                model=self.model,
                success=False,
                error=error_msg,
                latency_ms=latency,
            )

        except httpx.HTTPStatusError as e:
            latency = (time.time() - start_time) * 1000
            if e.response.status_code == 404:
                error_msg = f"Modelo '{self.model}' não encontrado no Ollama. Verifique se o modelo está instalado."
            else:
                error_msg = f"Ollama retornou erro HTTP {e.response.status_code}"
            logger.error(f"❌ Ollama: {error_msg}")
            return AIResponse(
                content="",
                provider=self.name,
                model=self.model,
                success=False,
                error=error_msg,
                latency_ms=latency,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Erro Ollama: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return AIResponse(
                content="",
                provider=self.name,
                model=self.model,
                success=False,
                error=error_msg,
                latency_ms=latency,
            )

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Chat de texto usando modelo local."""
        start_time = time.time()

        try:
            payload = {
                "model": self.text_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.3,
                    "num_predict": 2048,
                },
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )
                response.raise_for_status()

            data = response.json()
            content = data.get("message", {}).get("content", "")
            latency = (time.time() - start_time) * 1000

            logger.info(f"🤖 Ollama [{self.text_model}]: Chat concluído em {latency:.0f}ms")

            return AIResponse(
                content=content,
                provider=self.name,
                model=self.text_model,
                success=True,
                latency_ms=latency,
                tokens_used=data.get("eval_count", 0),
                raw_response=data,
            )

        except httpx.ConnectError:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Ollama não está rodando em {self.base_url}"
            logger.error(f"❌ Ollama: {error_msg}")
            return AIResponse(
                content="",
                provider=self.name,
                model=self.text_model,
                success=False,
                error=error_msg,
                latency_ms=latency,
            )

        except httpx.HTTPStatusError as e:
            latency = (time.time() - start_time) * 1000
            if e.response.status_code == 404:
                error_msg = f"Modelo '{self.text_model}' não encontrado no Ollama. Verifique se o modelo está instalado."
            else:
                error_msg = f"Ollama retornou erro HTTP {e.response.status_code}"
            logger.error(f"❌ Ollama: {error_msg}")
            return AIResponse(
                content="",
                provider=self.name,
                model=self.text_model,
                success=False,
                error=error_msg,
                latency_ms=latency,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Erro Ollama: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return AIResponse(
                content="",
                provider=self.name,
                model=self.text_model,
                success=False,
                error=error_msg,
                latency_ms=latency,
            )

    async def chat_freeform(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Chat em texto livre (sem forçar JSON) — usado para consultas e respostas narrativas."""
        start_time = time.time()

        try:
            payload = {
                "model": self.text_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
                "options": {
                    "temperature": 0.5,
                    "num_predict": 2048,
                },
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )
                response.raise_for_status()

            data = response.json()
            content = data.get("message", {}).get("content", "")
            latency = (time.time() - start_time) * 1000

            logger.info(f"Ollama [{self.text_model}]: Chat freeform concluido em {latency:.0f}ms")

            return AIResponse(
                content=content,
                provider=self.name,
                model=self.text_model,
                success=True,
                latency_ms=latency,
                tokens_used=data.get("eval_count", 0),
                raw_response=data,
            )

        except httpx.ConnectError:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Ollama nao esta rodando em {self.base_url}"
            logger.error(f"Ollama: {error_msg}")
            return AIResponse(
                content="", provider=self.name, model=self.text_model,
                success=False, error=error_msg, latency_ms=latency,
            )

        except httpx.HTTPStatusError as e:
            latency = (time.time() - start_time) * 1000
            if e.response.status_code == 404:
                error_msg = f"Modelo '{self.text_model}' nao encontrado no Ollama. Verifique se o modelo esta instalado."
            else:
                error_msg = f"Ollama retornou erro HTTP {e.response.status_code}"
            logger.error(f"Ollama: {error_msg}")
            return AIResponse(
                content="", provider=self.name, model=self.text_model,
                success=False, error=error_msg, latency_ms=latency,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Erro Ollama: {str(e)}"
            logger.error(f"{error_msg}")
            return AIResponse(
                content="", provider=self.name, model=self.text_model,
                success=False, error=error_msg, latency_ms=latency,
            )

    async def is_available(self) -> bool:
        """Verifica se o Ollama está rodando e ao menos um modelo está disponível."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "").split(":")[0] for m in models]
                    vision_ok = self.model.split(":")[0] in model_names
                    text_ok = self.text_model.split(":")[0] in model_names
                    if not vision_ok and not text_ok:
                        logger.warning(
                            f"Ollama rodando mas nenhum modelo configurado encontrado "
                            f"(vision='{self.model}', text='{self.text_model}'). "
                            f"Disponiveis: {model_names}"
                        )
                        return False
                    if not vision_ok:
                        logger.warning(
                            f"Ollama: modelo vision '{self.model}' nao encontrado, "
                            f"mas texto '{self.text_model}' disponivel."
                        )
                    return True
        except Exception:
            return False

    def get_info(self) -> dict:
        return {
            "name": self.name,
            "type": "local",
            "base_url": self.base_url,
            "vision_model": self.model,
            "text_model": self.text_model,
        }
