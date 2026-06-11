"""
PlantiuIA — Rotas de Irrigação
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from models.database import get_db, Plant, SensorReading, IrrigationLog
from models.schemas import IrrigationRequest, IrrigationDecision, IrrigationLogResponse
from core.ai_gateway import ai_gateway
from core.prompt_manager import PromptManager

router = APIRouter()


@router.post("/decide/{plant_id}", response_model=IrrigationDecision)
async def decide_irrigation(plant_id: int, db: AsyncSession = Depends(get_db)):
    """
    Consulta a IA para decidir se deve irrigar a planta.
    Analisa umidade do solo, clima e parâmetros da planta.
    """
    # Buscar planta
    result = await db.execute(select(Plant).where(Plant.id == plant_id))
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada")

    # Buscar última leitura de sensor
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.plant_id == plant_id)
        .order_by(SensorReading.created_at.desc())
        .limit(1)
    )
    latest_reading = result.scalar_one_or_none()

    # Buscar última irrigação
    result = await db.execute(
        select(IrrigationLog)
        .where(IrrigationLog.plant_id == plant_id)
        .order_by(IrrigationLog.created_at.desc())
        .limit(1)
    )
    last_irrigation = result.scalar_one_or_none()
    last_irrigation_str = (
        last_irrigation.created_at.strftime("%d/%m/%Y %H:%M")
        if last_irrigation
        else "Nunca irrigada"
    )

    # Montar dados para o prompt
    soil_moisture = latest_reading.soil_moisture if latest_reading else 50.0
    air_temp = latest_reading.air_temperature if latest_reading else 25.0
    air_humidity = latest_reading.air_humidity if latest_reading else 60.0

    system_prompt, user_prompt = PromptManager.get_irrigation_prompt(
        soil_moisture=soil_moisture,
        air_temperature=air_temp,
        air_humidity=air_humidity,
        last_irrigation=last_irrigation_str,
        plant_name=plant.name,
        plant_stage=plant.stage,
        weather_forecast="Sem dados meteorológicos disponíveis",
        ideal_moisture_min=plant.ideal_moisture_min,
        ideal_moisture_max=plant.ideal_moisture_max,
        drought_tolerance=plant.drought_tolerance,
        water_needs=plant.water_needs,
    )

    # Consultar IA
    logger.info(f"💧 Decisão de irrigação para: {plant.name} (umidade solo: {soil_moisture}%)")
    ai_response = await ai_gateway.chat(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )

    if not ai_response.success:
        # Fallback: decisão simples baseada em regras
        logger.warning("⚠️ IA indisponível, usando decisão baseada em regras")
        should_irrigate = soil_moisture < plant.ideal_moisture_min
        return IrrigationDecision(
            should_irrigate=should_irrigate,
            confidence=60.0,
            duration_minutes=15 if should_irrigate else 0,
            reasoning=f"Decisão por regra: umidade ({soil_moisture}%) {'abaixo' if should_irrigate else 'acima'} do mínimo ({plant.ideal_moisture_min}%)",
            urgency="medium" if should_irrigate else "none",
            next_check_minutes=30,
            warnings=["IA indisponível — usando decisão baseada em regras"],
        )

    # Parsear resposta da IA
    try:
        parsed = json.loads(ai_response.content)
        return IrrigationDecision(**parsed)
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Erro ao parsear decisão da IA: {e}")
        return IrrigationDecision(
            should_irrigate=soil_moisture < plant.ideal_moisture_min,
            confidence=50.0,
            reasoning="Erro ao interpretar resposta da IA, usando decisão por regra",
            warnings=["Resposta da IA não foi parseada corretamente"],
        )


@router.post("/trigger", response_model=IrrigationLogResponse)
async def trigger_irrigation(
    data: IrrigationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Ativa irrigação (manual ou por decisão da IA).
    """
    # Validar planta
    result = await db.execute(select(Plant).where(Plant.id == data.plant_id))
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada")

    # Buscar umidade atual
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.plant_id == data.plant_id)
        .order_by(SensorReading.created_at.desc())
        .limit(1)
    )
    latest_reading = result.scalar_one_or_none()
    moisture_before = latest_reading.soil_moisture if latest_reading else None

    # Registrar irrigação
    log = IrrigationLog(
        plant_id=data.plant_id,
        triggered_by=data.triggered_by,
        duration_minutes=data.duration_minutes,
        soil_moisture_before=moisture_before,
        ai_reasoning=f"Irrigação {data.triggered_by} por {data.duration_minutes} min",
        status="completed",
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    logger.info(
        f"💧 Irrigação ativada: planta={plant.name}, "
        f"duração={data.duration_minutes}min, tipo={data.triggered_by}"
    )

    return log


@router.get("/history/{plant_id}", response_model=list[IrrigationLogResponse])
async def get_irrigation_history(
    plant_id: int,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Retorna histórico de irrigação de uma planta."""
    result = await db.execute(
        select(IrrigationLog)
        .where(IrrigationLog.plant_id == plant_id)
        .order_by(IrrigationLog.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
