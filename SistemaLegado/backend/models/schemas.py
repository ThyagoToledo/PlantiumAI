"""
PlantiuIA — Schemas Pydantic (Validação e Serialização)
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


# ==========================================
# Plantas
# ==========================================

class PlantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    species: str = ""
    stage: str = "vegetative"
    location: str = ""
    ideal_moisture_min: float = 35.0
    ideal_moisture_max: float = 65.0
    ideal_temp_min: float = 18.0
    ideal_temp_max: float = 30.0
    drought_tolerance: str = "moderada"
    water_needs: str = "média"
    notes: str = ""


class PlantUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    stage: Optional[str] = None
    location: Optional[str] = None
    ideal_moisture_min: Optional[float] = None
    ideal_moisture_max: Optional[float] = None
    ideal_temp_min: Optional[float] = None
    ideal_temp_max: Optional[float] = None
    drought_tolerance: Optional[str] = None
    water_needs: Optional[str] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


class PlantResponse(BaseModel):
    id: int
    name: str
    species: str
    stage: str
    location: str
    ideal_moisture_min: float
    ideal_moisture_max: float
    ideal_temp_min: float
    ideal_temp_max: float
    drought_tolerance: str
    water_needs: str
    notes: str
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ==========================================
# Análises
# ==========================================

class DiagnosisDetail(BaseModel):
    primary_issue: str = "Saudável"
    category: str = "healthy"
    severity: str = "none"
    details: str = ""


class Recommendation(BaseModel):
    action: str
    priority: str = "short_term"
    details: str = ""


class NutrientStatus(BaseModel):
    nitrogen: str = "adequate"
    phosphorus: str = "adequate"
    potassium: str = "adequate"
    notes: str = ""


class AnalysisResult(BaseModel):
    health_status: str = "good"
    confidence: float = 0.0
    diagnosis: DiagnosisDetail = DiagnosisDetail()
    observations: list[str] = []
    recommendations: list[Recommendation] = []
    nutrients: NutrientStatus = NutrientStatus()


class AnalysisResponse(BaseModel):
    id: int
    plant_id: int
    analysis_type: str
    image_path: str
    health_status: str
    confidence: float
    diagnosis: dict
    observations: list
    recommendations: list
    nutrients: dict
    ai_provider: str
    ai_model: str
    latency_ms: float
    tokens_used: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ==========================================
# Sensores
# ==========================================

class SensorReadingCreate(BaseModel):
    plant_id: int
    soil_moisture: Optional[float] = None
    air_temperature: Optional[float] = None
    air_humidity: Optional[float] = None
    light_level: Optional[float] = None
    soil_temperature: Optional[float] = None
    co2_level: Optional[float] = None
    ph_level: Optional[float] = None
    source: str = "manual"


class SensorReadingResponse(BaseModel):
    id: int
    plant_id: int
    soil_moisture: Optional[float]
    air_temperature: Optional[float]
    air_humidity: Optional[float]
    light_level: Optional[float]
    soil_temperature: Optional[float]
    co2_level: Optional[float]
    ph_level: Optional[float]
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ==========================================
# Irrigação
# ==========================================

class IrrigationRequest(BaseModel):
    plant_id: int
    duration_minutes: float = 15
    triggered_by: str = "manual"


class IrrigationDecision(BaseModel):
    should_irrigate: bool = False
    confidence: float = 0.0
    duration_minutes: float = 0
    reasoning: str = ""
    urgency: str = "none"
    next_check_minutes: int = 30
    warnings: list[str] = []


class IrrigationLogResponse(BaseModel):
    id: int
    plant_id: int
    triggered_by: str
    duration_minutes: float
    water_volume_ml: Optional[float]
    soil_moisture_before: Optional[float]
    soil_moisture_after: Optional[float]
    ai_reasoning: str
    ai_confidence: Optional[float]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ==========================================
# Alertas
# ==========================================

class AlertResponse(BaseModel):
    id: int
    plant_id: Optional[int]
    severity: str
    category: str
    title: str
    message: str
    read: bool
    resolved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ==========================================
# Dashboard
# ==========================================

class DashboardSummary(BaseModel):
    total_plants: int = 0
    healthy_plants: int = 0
    plants_needing_attention: int = 0
    total_analyses: int = 0
    total_irrigations: int = 0
    unread_alerts: int = 0
    ai_status: dict = {}
    latest_readings: dict = {}
    recent_analyses: list = []
    recent_alerts: list = []


# ==========================================
# Configurações de IA
# ==========================================

class AISettingsUpdate(BaseModel):
    ai_mode: Optional[str] = None
    ollama_base_url: Optional[str] = None
    ollama_model: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None


class AIStatusResponse(BaseModel):
    mode: str
    providers: dict
    metrics: dict
    recent_requests: list


# ==========================================
# Consulta Geral
# ==========================================

class ConsultationRequest(BaseModel):
    question: str = Field(..., min_length=5)
    crops: str = "Diversas"
    location: str = "Brasil"
    season: str = "Atual"


class ConsultationResponse(BaseModel):
    answer: str
    provider: str
    model: str
    latency_ms: float
