"""
PlantiuIA — Enumerações e Constantes
"""

from enum import Enum


class AIMode(str, Enum):
    """Modos de operação do AI Gateway."""
    LOCAL_ONLY = "local_only"
    API_ONLY = "api_only"
    HYBRID_PREFER_API = "hybrid_prefer_api"
    HYBRID_PREFER_LOCAL = "hybrid_prefer_local"
    SMART_FAILOVER = "smart_failover"


class AnalysisType(str, Enum):
    """Tipos de análise de planta."""
    LEAF = "leaf"                          # Análise de folha individual
    FULL_PLANT = "full_plant"              # Planta inteira
    SOIL = "soil"                          # Análise do solo
    FRUIT = "fruit"                        # Fruto
    ROOT = "root"                          # Raiz


class HealthStatus(str, Enum):
    """Status de saúde da planta."""
    EXCELLENT = "excellent"
    GOOD = "good"
    MODERATE = "moderate"
    POOR = "poor"
    CRITICAL = "critical"


class IrrigationStatus(str, Enum):
    """Status do sistema de irrigação."""
    IDLE = "idle"                          # Parado
    ACTIVE = "active"                      # Irrigando
    SCHEDULED = "scheduled"                # Agendado
    PAUSED = "paused"                      # Pausado manualmente
    ERROR = "error"                        # Erro no sistema


class SoilMoistureLevel(str, Enum):
    """Níveis de umidade do solo."""
    DRY = "dry"                            # < 20%
    LOW = "low"                            # 20-35%
    OPTIMAL = "optimal"                    # 35-65%
    HIGH = "high"                          # 65-80%
    SATURATED = "saturated"                # > 80%


class AlertSeverity(str, Enum):
    """Severidade de alertas."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class ProviderStatus(str, Enum):
    """Status de um provedor de IA."""
    AVAILABLE = "available"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"


class CircuitState(str, Enum):
    """Estado do circuit breaker."""
    CLOSED = "closed"                      # Funcionando normal
    OPEN = "open"                          # Bloqueado (muitas falhas)
    HALF_OPEN = "half_open"                # Testando recuperação


class PlantStage(str, Enum):
    """Estágio de crescimento da planta."""
    SEED = "seed"                          # Semente
    GERMINATION = "germination"            # Germinação
    SEEDLING = "seedling"                  # Muda
    VEGETATIVE = "vegetative"              # Vegetativo
    FLOWERING = "flowering"                # Floração
    FRUITING = "fruiting"                  # Frutificação
    HARVEST = "harvest"                    # Colheita


class DiseaseCategory(str, Enum):
    """Categorias de doenças/problemas."""
    FUNGAL = "fungal"                      # Fungo
    BACTERIAL = "bacterial"                # Bactéria
    VIRAL = "viral"                        # Vírus
    NUTRIENT_DEFICIENCY = "nutrient_deficiency"  # Deficiência nutricional
    PEST = "pest"                          # Praga
    WATER_STRESS = "water_stress"          # Estresse hídrico
    LIGHT_STRESS = "light_stress"          # Estresse luminoso
    TEMPERATURE_STRESS = "temperature_stress"  # Estresse térmico
    HEALTHY = "healthy"                    # Saudável
