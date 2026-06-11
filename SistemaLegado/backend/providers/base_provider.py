"""
PlantiuIA — Base Provider
Interface abstrata para todos os provedores de IA.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import time


@dataclass
class AIResponse:
    """Resposta padronizada de qualquer provedor de IA."""
    content: str
    provider: str
    model: str
    success: bool = True
    error: str | None = None
    latency_ms: float = 0
    tokens_used: int = 0
    raw_response: dict = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


class BaseProvider(ABC):
    """Interface base que todos os provedores de IA devem implementar."""

    name: str = "base"

    @abstractmethod
    async def analyze_image(
        self,
        image_bytes: bytes,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """
        Analisa uma imagem com um prompt de texto.
        
        Args:
            image_bytes: Imagem em bytes (JPEG/PNG)
            system_prompt: Prompt de sistema definindo o papel da IA
            user_prompt: Prompt do usuário com a instrução específica
            
        Returns:
            AIResponse com o resultado da análise
        """
        ...

    @abstractmethod
    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AIResponse:
        """
        Chat de texto (sem imagem).
        
        Args:
            system_prompt: Prompt de sistema
            user_prompt: Mensagem do usuário
            
        Returns:
            AIResponse com a resposta
        """
        ...

    @abstractmethod
    async def is_available(self) -> bool:
        """Verifica se o provedor está disponível e funcional."""
        ...

    def get_info(self) -> dict:
        """Retorna informações sobre o provedor."""
        return {
            "name": self.name,
            "type": "base",
        }
