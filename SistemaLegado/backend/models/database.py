"""
PlantiuIA — Modelos de Banco de Dados (SQLAlchemy)
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, 
    ForeignKey, JSON, create_engine,
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from config import settings


class Base(DeclarativeBase):
    """Base para todos os modelos."""
    pass


class Plant(Base):
    """Perfil de uma planta/cultura monitorada."""
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    species = Column(String(200), default="")
    stage = Column(String(50), default="vegetative")
    location = Column(String(200), default="")
    planted_at = Column(DateTime, nullable=True)
    
    # Parâmetros ideais
    ideal_moisture_min = Column(Float, default=35.0)
    ideal_moisture_max = Column(Float, default=65.0)
    ideal_temp_min = Column(Float, default=18.0)
    ideal_temp_max = Column(Float, default=30.0)
    drought_tolerance = Column(String(20), default="moderada")
    water_needs = Column(String(20), default="média")
    
    notes = Column(Text, default="")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    analyses = relationship("Analysis", back_populates="plant", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="plant", cascade="all, delete-orphan")
    irrigation_logs = relationship("IrrigationLog", back_populates="plant", cascade="all, delete-orphan")


class Analysis(Base):
    """Registro de uma análise de IA sobre a planta."""
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    
    analysis_type = Column(String(30), nullable=False)  # leaf, full_plant, soil, etc.
    image_path = Column(String(500), default="")
    
    # Resultado da IA
    health_status = Column(String(20), default="")
    confidence = Column(Float, default=0.0)
    diagnosis = Column(JSON, default={})
    observations = Column(JSON, default=[])
    recommendations = Column(JSON, default=[])
    nutrients = Column(JSON, default={})
    raw_response = Column(Text, default="")
    
    # Metadados da IA
    ai_provider = Column(String(30), default="")
    ai_model = Column(String(100), default="")
    latency_ms = Column(Float, default=0.0)
    tokens_used = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento
    plant = relationship("Plant", back_populates="analyses")


class SensorReading(Base):
    """Leitura de sensor (real ou simulada)."""
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    
    soil_moisture = Column(Float, nullable=True)      # % (0-100)
    air_temperature = Column(Float, nullable=True)     # °C
    air_humidity = Column(Float, nullable=True)         # % (0-100)
    light_level = Column(Float, nullable=True)          # lux
    soil_temperature = Column(Float, nullable=True)     # °C
    co2_level = Column(Float, nullable=True)            # ppm
    ph_level = Column(Float, nullable=True)             # pH (0-14)
    
    source = Column(String(30), default="simulated")   # simulated, esp32, manual
    created_at = Column(DateTime, default=datetime.utcnow)

    plant = relationship("Plant", back_populates="sensor_readings")


class IrrigationLog(Base):
    """Registro de irrigação (automática ou manual)."""
    __tablename__ = "irrigation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    
    triggered_by = Column(String(30), default="manual")  # manual, ai, schedule
    duration_minutes = Column(Float, default=0)
    water_volume_ml = Column(Float, nullable=True)
    
    # Dados do momento da irrigação
    soil_moisture_before = Column(Float, nullable=True)
    soil_moisture_after = Column(Float, nullable=True)
    
    # Decisão da IA
    ai_reasoning = Column(Text, default="")
    ai_confidence = Column(Float, nullable=True)
    
    status = Column(String(20), default="completed")  # completed, failed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    plant = relationship("Plant", back_populates="irrigation_logs")


class Alert(Base):
    """Alertas do sistema."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=True)
    
    severity = Column(String(20), nullable=False)   # info, warning, critical
    category = Column(String(50), default="")        # irrigation, health, sensor, system
    title = Column(String(200), nullable=False)
    message = Column(Text, default="")
    
    read = Column(Boolean, default=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AILog(Base):
    """Log de todas as interações com IA (auditoria)."""
    __tablename__ = "ai_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    request_type = Column(String(30), default="")     # analysis, irrigation, chat
    provider = Column(String(30), default="")
    model = Column(String(100), default="")
    mode = Column(String(30), default="")              # Modo do gateway usado
    
    success = Column(Boolean, default=True)
    was_failover = Column(Boolean, default=False)
    latency_ms = Column(Float, default=0.0)
    tokens_used = Column(Integer, default=0)
    error = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


# --- Engine e Session ---
# Garantir caminho absoluto para o SQLite
from config import DATA_DIR
_db_path = DATA_DIR / "plantiu.db"
_db_url = f"sqlite+aiosqlite:///{_db_path}"
engine = create_async_engine(_db_url, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Cria todas as tabelas no banco de dados."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncSession:
    """Dependency injection para FastAPI."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
