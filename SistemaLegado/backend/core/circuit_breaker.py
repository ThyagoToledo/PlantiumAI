"""
PlantiuIA — Circuit Breaker Pattern
Protege o sistema contra falhas em cascata ao alternar entre provedores de IA.
"""

import time
from enum import Enum
from loguru import logger


class CircuitState(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """
    Implementação do padrão Circuit Breaker para provedores de IA.
    
    Estados:
    - CLOSED: Funcionando normalmente, requisições passam para o provedor
    - OPEN: Provedor falhou demais, requisições são bloqueadas
    - HALF_OPEN: Testando se o provedor se recuperou
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 3,
        recovery_timeout: int = 60,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: float | None = None
        self._last_state_change: float = time.time()

    @property
    def state(self) -> CircuitState:
        """Estado atual com auto-transição de OPEN → HALF_OPEN após timeout."""
        if self._state == CircuitState.OPEN and self._last_failure_time:
            elapsed = time.time() - self._last_failure_time
            if elapsed >= self.recovery_timeout:
                logger.info(
                    f"🔄 Circuit Breaker [{self.name}]: OPEN → HALF_OPEN "
                    f"(após {elapsed:.0f}s de recovery timeout)"
                )
                self._state = CircuitState.HALF_OPEN
                self._last_state_change = time.time()
        return self._state

    @property
    def is_available(self) -> bool:
        """Verifica se o provedor pode receber requisições."""
        return self.state in (CircuitState.CLOSED, CircuitState.HALF_OPEN)

    def record_success(self):
        """Registra uma requisição bem-sucedida."""
        self._success_count += 1

        if self._state == CircuitState.HALF_OPEN:
            logger.info(
                f"✅ Circuit Breaker [{self.name}]: HALF_OPEN → CLOSED "
                f"(provedor recuperou)"
            )
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            self._last_state_change = time.time()
        elif self._state == CircuitState.CLOSED:
            # Reset gradual de falhas em sucesso
            if self._failure_count > 0:
                self._failure_count = max(0, self._failure_count - 1)

    def record_failure(self, error: Exception | None = None):
        """Registra uma falha no provedor."""
        self._failure_count += 1
        self._last_failure_time = time.time()

        error_msg = str(error)[:100] if error else "Unknown"

        if self._state == CircuitState.HALF_OPEN:
            logger.warning(
                f"❌ Circuit Breaker [{self.name}]: HALF_OPEN → OPEN "
                f"(falha durante recuperação: {error_msg})"
            )
            self._state = CircuitState.OPEN
            self._last_state_change = time.time()

        elif self._state == CircuitState.CLOSED:
            if self._failure_count >= self.failure_threshold:
                logger.error(
                    f"🚫 Circuit Breaker [{self.name}]: CLOSED → OPEN "
                    f"(atingiu {self._failure_count} falhas: {error_msg})"
                )
                self._state = CircuitState.OPEN
                self._last_state_change = time.time()
            else:
                logger.warning(
                    f"⚠️ Circuit Breaker [{self.name}]: Falha {self._failure_count}/"
                    f"{self.failure_threshold} ({error_msg})"
                )

    def reset(self):
        """Reset manual do circuit breaker."""
        logger.info(f"🔁 Circuit Breaker [{self.name}]: Reset manual")
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = None
        self._last_state_change = time.time()

    def get_stats(self) -> dict:
        """Retorna estatísticas do circuit breaker."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self._failure_count,
            "success_count": self._success_count,
            "failure_threshold": self.failure_threshold,
            "recovery_timeout": self.recovery_timeout,
            "last_failure_time": self._last_failure_time,
            "last_state_change": self._last_state_change,
            "is_available": self.is_available,
        }

    def __repr__(self) -> str:
        return (
            f"CircuitBreaker(name={self.name!r}, state={self.state.value}, "
            f"failures={self._failure_count}/{self.failure_threshold})"
        )
