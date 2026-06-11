"""
PlantiuIA — Rotas de Sensores
"""

import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from models.database import get_db, Plant, SensorReading
from models.schemas import SensorReadingCreate, SensorReadingResponse

router = APIRouter()


@router.post("/reading", response_model=SensorReadingResponse)
async def add_reading(
    data: SensorReadingCreate,
    db: AsyncSession = Depends(get_db),
):
    """Adiciona uma leitura de sensor (real ou manual)."""
    result = await db.execute(select(Plant).where(Plant.id == data.plant_id))
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada")

    reading = SensorReading(**data.model_dump())
    db.add(reading)
    await db.commit()
    await db.refresh(reading)

    logger.debug(
        f"📡 Sensor [{data.source}]: planta={plant.name}, "
        f"umidade_solo={data.soil_moisture}%"
    )
    return reading


@router.post("/simulate/{plant_id}", response_model=SensorReadingResponse)
async def simulate_reading(plant_id: int, db: AsyncSession = Depends(get_db)):
    """
    Gera uma leitura simulada realista para teste.
    Os valores simulam variação natural ao longo do dia.
    """
    result = await db.execute(select(Plant).where(Plant.id == plant_id))
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada")

    # Buscar última leitura para continuidade
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.plant_id == plant_id)
        .order_by(SensorReading.created_at.desc())
        .limit(1)
    )
    last_reading = result.scalar_one_or_none()

    # Gerar valores com variação gradual
    if last_reading and last_reading.soil_moisture is not None:
        # Decair umidade gradualmente (simula evaporação)
        base_moisture = last_reading.soil_moisture - random.uniform(0.5, 2.0)
        base_temp = last_reading.air_temperature + random.uniform(-0.5, 0.5)
        base_humidity = last_reading.air_humidity + random.uniform(-2, 2)
    else:
        base_moisture = random.uniform(40, 70)
        base_temp = random.uniform(20, 32)
        base_humidity = random.uniform(45, 75)

    # Hora do dia afeta temperatura
    hour = datetime.now().hour
    temp_modifier = 0
    if 10 <= hour <= 16:
        temp_modifier = random.uniform(2, 6)  # Mais quente durante o dia
    elif hour >= 20 or hour <= 5:
        temp_modifier = random.uniform(-3, -1)  # Mais frio à noite

    reading = SensorReading(
        plant_id=plant_id,
        soil_moisture=max(5, min(95, base_moisture)),
        air_temperature=max(10, min(45, base_temp + temp_modifier)),
        air_humidity=max(20, min(95, base_humidity)),
        light_level=random.uniform(100, 80000) if 6 <= hour <= 18 else random.uniform(0, 10),
        soil_temperature=max(10, min(40, base_temp + temp_modifier - 3)),
        co2_level=random.uniform(350, 600),
        ph_level=random.uniform(5.5, 7.5),
        source="simulated",
    )

    db.add(reading)
    await db.commit()
    await db.refresh(reading)

    return reading


@router.get("/latest/{plant_id}", response_model=SensorReadingResponse)
async def get_latest_reading(plant_id: int, db: AsyncSession = Depends(get_db)):
    """Retorna a leitura mais recente."""
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.plant_id == plant_id)
        .order_by(SensorReading.created_at.desc())
        .limit(1)
    )
    reading = result.scalar_one_or_none()
    if not reading:
        raise HTTPException(status_code=404, detail="Nenhuma leitura encontrada")
    return reading


@router.get("/history/{plant_id}", response_model=list[SensorReadingResponse])
async def get_sensor_history(
    plant_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Retorna histórico de leituras de sensor."""
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.plant_id == plant_id)
        .order_by(SensorReading.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
