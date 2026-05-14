"""
PlantiuIA — MiniMax Provider
API OpenAI-compatível via MiniMax (https://api.minimax.chat/v1)
Modelo padrão: MiniMax-Text-01 (geração 2.7)
"""

import base64
import time
from loguru import logger
from providers.base_provider import BaseProvider, AIResponse


def _strip_markdown_json(text: str) -> str:
    """Remove blocos de markdown (```json ... ```) para obter JSON puro."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        return "\n".join(inner).strip()
    return text


class MinimaxProvider(BaseProvider):
    """Provedor de IA via MiniMax (API OpenAI-compatível)."""

    name = "minimax"
    BASE_URL = "https://api.minimax.chat/v1"

    def __init__(self, api_key: str, model: str = "MiniMax-Text-01"):
        self.api_key = api_key
        self.model = model
        self._client = None

    def _get_client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(
                api_key=self.api_key,
                base_url=self.BASE_URL,
            )
        return self._client

    async def analyze_image(
        self,
        image_bytes: bytes,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Analisa imagem via MiniMax (vision)."""
        start_time = time.time()

        try:
            client = self._get_client()
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            media_type = "image/png" if image_bytes[:4] == b'\x89PNG' else "image/jpeg"

            response = await client.chat.completions.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{media_type};base64,{image_b64}",
                                },
                            },
                            {"type": "text", "text": user_prompt},
                        ],
                    },
                ],
            )

            content = _strip_markdown_json(response.choices[0].message.content or "")
            latency = (time.time() - start_time) * 1000
            tokens = response.usage.total_tokens if response.usage else 0

            logger.info(f"MiniMax [{self.model}]: Analise concluida em {latency:.0f}ms ({tokens} tokens)")

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
            error_msg = f"Erro MiniMax: {str(e)}"
            logger.error(f"{error_msg}")
            return AIResponse(
                content="", provider=self.name, model=self.model,
                success=False, error=error_msg, latency_ms=latency,
            )

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Chat JSON com MiniMax."""
        start_time = time.time()

        try:
            client = self._get_client()

            response = await client.chat.completions.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )

            content = _strip_markdown_json(response.choices[0].message.content or "")
            latency = (time.time() - start_time) * 1000
            tokens = response.usage.total_tokens if response.usage else 0

            logger.info(f"MiniMax [{self.model}]: Chat concluido em {latency:.0f}ms ({tokens} tokens)")

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
            error_msg = f"Erro MiniMax: {str(e)}"
            logger.error(f"{error_msg}")
            return AIResponse(
                content="", provider=self.name, model=self.model,
                success=False, error=error_msg, latency_ms=latency,
            )

    async def chat_freeform(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Chat em texto livre — para consultas narrativas."""
        return await self.chat(system_prompt, user_prompt)

    async def is_available(self) -> bool:
        if not self.api_key:
            return False
        try:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=self.model,
                max_tokens=5,
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
            "base_url": self.BASE_URL,
            "has_key": bool(self.api_key),
        }
