"""
PlantiuIA — OpenAI Provider
"""

import base64
import time
from loguru import logger
from providers.base_provider import BaseProvider, AIResponse


class OpenAIProvider(BaseProvider):
    """Provedor de IA via API da OpenAI (GPT-4o)."""

    name = "openai"

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model
        self._client = None

    def _get_client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=self.api_key)
        return self._client

    async def analyze_image(
        self,
        image_bytes: bytes,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Analisa imagem usando GPT-4 Vision."""
        start_time = time.time()

        try:
            client = self._get_client()
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")

            media_type = "image/jpeg"
            if image_bytes[:4] == b'\x89PNG':
                media_type = "image/png"

            response = await client.chat.completions.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{media_type};base64,{image_b64}",
                                    "detail": "high",
                                },
                            },
                            {"type": "text", "text": user_prompt},
                        ],
                    },
                ],
            )

            content = response.choices[0].message.content or ""
            latency = (time.time() - start_time) * 1000
            tokens = response.usage.total_tokens if response.usage else 0

            logger.info(f"🌐 OpenAI [{self.model}]: Análise concluída em {latency:.0f}ms ({tokens} tokens)")

            return AIResponse(
                content=content,
                provider=self.name,
                model=self.model,
                success=True,
                latency_ms=latency,
                tokens_used=tokens,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Erro OpenAI: {str(e)}"
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
        """Chat de texto com GPT."""
        start_time = time.time()

        try:
            client = self._get_client()

            response = await client.chat.completions.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )

            content = response.choices[0].message.content or ""
            latency = (time.time() - start_time) * 1000
            tokens = response.usage.total_tokens if response.usage else 0

            logger.info(f"🌐 OpenAI [{self.model}]: Chat concluído em {latency:.0f}ms ({tokens} tokens)")

            return AIResponse(
                content=content,
                provider=self.name,
                model=self.model,
                success=True,
                latency_ms=latency,
                tokens_used=tokens,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            error_msg = f"Erro OpenAI: {str(e)}"
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
            client = self._get_client()
            response = await client.chat.completions.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
            )
            return bool(response.choices)
        except Exception:
            return False

    def get_info(self) -> dict:
        return {
            "name": self.name,
            "type": "api",
            "model": self.model,
            "has_key": bool(self.api_key),
        }
