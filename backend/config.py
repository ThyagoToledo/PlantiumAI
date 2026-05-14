"""
PlantiuIA — Configuração Global
Carrega variáveis de ambiente e expõe como objeto de configuração tipado.
"""

import os
from pathlib import Path
from enum import Enum
from pydantic_settings import BaseSettings
from pydantic import Field

# Diretório raiz do backend
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
MODELS_AI_DIR = BASE_DIR / "models_ai"

# Garantir que diretórios existam
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_AI_DIR.mkdir(parents=True, exist_ok=True)


class AIMode(str, Enum):
    """Modos de operação do AI Gateway."""
    LOCAL_ONLY = "local_only"
    API_ONLY = "api_only"
    HYBRID_PREFER_API = "hybrid_prefer_api"
    HYBRID_PREFER_LOCAL = "hybrid_prefer_local"
    SMART_FAILOVER = "smart_failover"


class Settings(BaseSettings):
    """Configurações carregadas do .env"""

    # --- Modo de IA ---
    ai_mode: AIMode = Field(default=AIMode.SMART_FAILOVER)

    # --- Modelo Local GGUF (IA Própria) ---
    local_model_path: str = Field(default="")
    local_model_threads: int = Field(default=0)
    local_model_context: int = Field(default=4096)
    local_model_gpu_layers: int = Field(default=0)

    # --- Ollama (IA Local alternativa) ---
    ollama_base_url: str = Field(default="http://localhost:11434")
    ollama_model: str = Field(default="llama3.2-vision")
    ollama_text_model: str = Field(default="llama3.2")

    # --- Anthropic (Claude) ---
    anthropic_api_key: str = Field(default="")
    anthropic_model: str = Field(default="claude-sonnet-4-20250514")

    # --- OpenAI ---
    openai_api_key: str = Field(default="")
    openai_model: str = Field(default="gpt-4o")

    # --- Google Gemini ---
    gemini_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-2.0-flash")

    # --- BlackBox AI ---
    blackbox_api_key: str = Field(default="")
    blackbox_model: str = Field(default="blackboxai/anthropic/claude-sonnet-4.6")

    # --- MiniMax ---
    minimax_api_key: str = Field(default="")
    minimax_model: str = Field(default="MiniMax-Text-01")

    # --- Meteorologia ---
    openweather_api_key: str = Field(default="")
    openweather_city: str = Field(default="São Paulo")
    openweather_country: str = Field(default="BR")

    # --- Servidor ---
    server_host: str = Field(default="0.0.0.0")
    server_port: int = Field(default=8000)
    debug: bool = Field(default=True)

    # --- Banco de Dados ---
    database_url: str = Field(default=f"sqlite+aiosqlite:///{DATA_DIR / 'plantiu.db'}")

    # --- Circuit Breaker ---
    cb_failure_threshold: int = Field(default=3)
    cb_recovery_timeout: int = Field(default=60)
    cb_expected_exception_codes: str = Field(default="429,500,502,503,504")

    model_config = {
        "env_file": str(BASE_DIR.parent / ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }

    @property
    def cb_error_codes(self) -> list[int]:
        """Retorna lista de códigos HTTP que ativam o circuit breaker."""
        return [int(c.strip()) for c in self.cb_expected_exception_codes.split(",")]

    @property
    def resolved_local_model_path(self) -> str:
        """Retorna o caminho completo do modelo local GGUF."""
        if self.local_model_path:
            p = Path(self.local_model_path)
            if p.is_absolute():
                return str(p)
            return str(MODELS_AI_DIR / self.local_model_path)
        # Procurar qualquer .gguf no diretório models_ai
        gguf_files = list(MODELS_AI_DIR.glob("*.gguf"))
        if gguf_files:
            return str(gguf_files[0])
        return ""

    def has_api_provider(self) -> bool:
        """Verifica se pelo menos um provedor de API está configurado."""
        return bool(
            self.anthropic_api_key
            or self.openai_api_key
            or self.gemini_api_key
            or self.blackbox_api_key
            or self.minimax_api_key
        )

    def has_local_model(self) -> bool:
        """Verifica se o modelo local GGUF existe."""
        path = self.resolved_local_model_path
        return bool(path) and Path(path).exists()

    def get_available_providers(self) -> list[str]:
        """Retorna lista de provedores disponíveis."""
        providers = []
        if self.has_local_model():
            providers.append("local_model")
        if self.anthropic_api_key:
            providers.append("claude")
        if self.openai_api_key:
            providers.append("openai")
        if self.gemini_api_key:
            providers.append("gemini")
        if self.blackbox_api_key:
            providers.append("blackbox")
        if self.minimax_api_key:
            providers.append("minimax")
        return providers


# Singleton
settings = Settings()
