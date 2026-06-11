"""
PlantiuIA — Claude Provider (Anthropic API)
"""

import base64
import time
from loguru import logger
from providers.base_provider import BaseProvider, AIResponse


class ClaudeProvider(BaseProvider):
    """Provedor de IA via API da Anthropic (Claude)."""

    name = "claude"

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.api_key = api_key
        self.model = model
        self._client = None

    def _get_client(self):
        if self._client is None:
            import anthropic
            self._client = anthropic.AsyncAnthropic(api_key=self.api_key)
        return self._client

    async def analyze_image(
        self,
        image_bytes: bytes,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """Analisa imagem usando Claude Vision."""
        start_time = time.time()

        try:
            client = self._get_client()
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")

            # Detectar tipo de imagem
            media_type = "image/jpeg"
            if image_bytes[:4] == b'\x89PNG':
                media_type = "image/png"
            elif image_bytes[:4] == b'RIFF':
                media_type = "image/webp"

            response = await client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_b64,
                                },
                            },
                            {
                                "type": "text",
                                "text": user_prompt,
                            },
                        ],
                    }
                ],
            )

            content = response.content[0].text if response.content else ""
            latency = (time.time() - start_time) * 1000
            tokens = (response.usage.input_tokens or 0) + (response.usage.output_tokens or 0)

            logger.info(f"🧠 Claude [{self.model}]: Análise concluída em {latency:.0f}ms ({tokens} tokens)")

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
            error_msg = f"Erro Claude: {str(e)}"
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
        """Chat de texto com Claude."""
        start_time = time.time()

        try:
            client = self._get_client()

            response = await client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ],
            )

            content = response.content[0].text if response.content else ""
            latency = (time.time() - start_time) * 1000
            tokens = (response.usage.input_tokens or 0) + (response.usage.output_tokens or 0)

            logger.info(f"🧠 Claude [{self.model}]: Chat concluído em {latency:.0f}ms ({tokens} tokens)")

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
            error_msg = f"Erro Claude: {str(e)}"
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
        """Verifica se a API key é válida."""
        if not self.api_key:
            return False
        try:
            client = self._get_client()
            # Teste leve — enviar mensagem mínima
            response = await client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
            )
            return bool(response.content)
        except Exception:
            return False

    def get_info(self) -> dict:
        return {
            "name": self.name,
            "type": "api",
            "model": self.model,
            "has_key": bool(self.api_key),
        }
