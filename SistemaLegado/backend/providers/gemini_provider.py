"""
PlantiuIA — Google Gemini Provider
"""

import base64
import time
from loguru import logger
from providers.base_provider import BaseProvider, AIResponse


class GeminiProvider(BaseProvider):
    """Provedor de IA via Google Gemini API."""

    name = "gemini"

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model = model
        self._client = None

    def _get_client(self):
        if self._client is None:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._client = genai.GenerativeModel(
                self.model,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                ),
            )
        return self._client

    async def analyze_image(
        self,
        image_bytes: bytes,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Analisa imagem usando Gemini Vision."""
        start_time = time.time()

        try:
            import google.generativeai as genai

            model = self._get_client()

            # Criar imagem no formato Gemini
            image_part = {
                "mime_type": "image/jpeg",
                "data": image_bytes,
            }

            if image_bytes[:4] == b'\x89PNG':
                image_part["mime_type"] = "image/png"

            full_prompt = f"{system_prompt}\n\n{user_prompt}"

            response = await model.generate_content_async(
                [full_prompt, image_part]
            )

            content = response.text or ""
            latency = (time.time() - start_time) * 1000

            logger.info(f"💎 Gemini [{self.model}]: Análise concluída em {latency:.0f}ms")

            return AIResponse(
                content=content,
                provider=self.name,
                model=self.model,
                success=True,
                latency_ms=latency,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Erro Gemini: {str(e)}"
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
        """Chat de texto com Gemini."""
        start_time = time.time()

        try:
            model = self._get_client()
            full_prompt = f"{system_prompt}\n\n{user_prompt}"

            response = await model.generate_content_async(full_prompt)

            content = response.text or ""
            latency = (time.time() - start_time) * 1000

            logger.info(f"💎 Gemini [{self.model}]: Chat concluído em {latency:.0f}ms")

            return AIResponse(
                content=content,
                provider=self.name,
                model=self.model,
                success=True,
                latency_ms=latency,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Erro Gemini: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return AIResponse(
                content="",
                provider=self.name,
                model=self.model,
                success=False,
                error=error_msg,
                latency_ms=latency,
            )

    async def is_available(self) -> bool:
        if not self.api_key:
            return False
        try:
            model = self._get_client()
            response = await model.generate_content_async("ping")
            return bool(response.text)
        except Exception:
            return False

    def get_info(self) -> dict:
        return {
            "name": self.name,
            "type": "api",
            "model": self.model,
            "has_key": bool(self.api_key),
        }
