"""
PlantiuIA — Rotas do Dashboard
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db, Plant, Analysis, SensorReading, IrrigationLog, Alert
from models.schemas import DashboardSummary, ConsultationRequest, ConsultationResponse
from core.ai_gateway import ai_gateway
from core.prompt_manager import PromptManager

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Retorna resumo geral para o dashboard."""
    
    # Total de plantas
    result = await db.execute(select(func.count(Plant.id)).where(Plant.active == True))
    total_plants = result.scalar() or 0

    # Total de análises
    result = await db.execute(select(func.count(Analysis.id)))
    total_analyses = result.scalar() or 0

    # Total de irrigações
    result = await db.execute(select(func.count(IrrigationLog.id)))
    total_irrigations = result.scalar() or 0

    # Alertas não lidos
    result = await db.execute(
        select(func.count(Alert.id)).where(Alert.read == False)
    )
    unread_alerts = result.scalar() or 0

    # Plantas saudáveis (baseado na última análise)
    healthy_count = 0
    attention_count = 0
    
    result = await db.execute(select(Plant).where(Plant.active == True))
    plants = result.scalars().all()
    
    for plant in plants:
        last_analysis = await db.execute(
            select(Analysis)
            .where(Analysis.plant_id == plant.id)
            .order_by(Analysis.created_at.desc())
            .limit(1)
        )
        analysis = last_analysis.scalar_one_or_none()
        if analysis:
            if analysis.health_status in ("excellent", "good"):
                healthy_count += 1
            elif analysis.health_status in ("poor", "critical"):
                attention_count += 1

    # Análises recentes
    result = await db.execute(
        select(Analysis).order_by(Analysis.created_at.desc()).limit(5)
    )
    recent_analyses = [
        {
            "id": a.id,
            "plant_id": a.plant_id,
            "type": a.analysis_type,
            "health": a.health_status,
            "confidence": a.confidence,
            "provider": a.ai_provider,
            "created_at": a.created_at.isoformat(),
        }
        for a in result.scalars().all()
    ]

    # Alertas recentes
    result = await db.execute(
        select(Alert).where(Alert.read == False).order_by(Alert.created_at.desc()).limit(5)
    )
    recent_alerts = [
        {
            "id": a.id,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "created_at": a.created_at.isoformat(),
        }
        for a in result.scalars().all()
    ]

    # Status da IA
    ai_status = ai_gateway.get_status()

    return DashboardSummary(
        total_plants=total_plants,
        healthy_plants=healthy_count,
        plants_needing_attention=attention_count,
        total_analyses=total_analyses,
        total_irrigations=total_irrigations,
        unread_alerts=unread_alerts,
        ai_status=ai_status,
        recent_analyses=recent_analyses,
        recent_alerts=recent_alerts,
    )


@router.post("/consult", response_model=ConsultationResponse)
async def consult_ai(data: ConsultationRequest):
    """Consulta geral ao assistente agrícola IA."""
    system_prompt, user_prompt = PromptManager.get_consultation_prompt(
        question=data.question,
        crops=data.crops,
        location=data.location,
        season=data.season,
    )

    response = await ai_gateway.chat(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        freeform=True,
    )

    if not response.success:
        return ConsultationResponse(
            answer="Desculpe, não consegui processar sua consulta no momento. Todos os provedores de IA estão indisponíveis.",
            provider="none",
            model="none",
            latency_ms=response.latency_ms,
        )

    return ConsultationResponse(
        answer=response.content,
        provider=response.provider,
        model=response.model,
        latency_ms=response.latency_ms,
    )
