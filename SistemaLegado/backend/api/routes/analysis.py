"""
PlantiuIA — Rotas de Análise de Imagem
"""

import json
import uuid
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from config import UPLOADS_DIR
from models.database import get_db, Plant, Analysis
from models.schemas import AnalysisResponse
from core.ai_gateway import ai_gateway
from core.prompt_manager import PromptManager
from models.enums import AnalysisType

router = APIRouter()


@router.post("/image", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    plant_id: int = Form(...),
    analysis_type: str = Form("leaf"),
    extra_info: str = Form(""),
    db: AsyncSession = Depends(get_db),
):
    """
    Analisa uma imagem de planta usando IA.
    
    - Upload de foto (JPEG/PNG)
    - Escolher tipo de análise (leaf, full_plant, soil, fruit, root)
    - IA retorna diagnóstico, saúde e recomendações
    """
    # Validar planta
    result = await db.execute(select(Plant).where(Plant.id == plant_id))
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada")

    # Validar tipo de análise
    try:
        a_type = AnalysisType(analysis_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de análise inválido. Use: {[t.value for t in AnalysisType]}"
        )

    # Ler imagem
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Arquivo de imagem vazio")

    # Salvar imagem
    ext = Path(file.filename or "image.jpg").suffix or ".jpg"
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
    image_path = UPLOADS_DIR / filename
    image_path.write_bytes(image_bytes)

    # Gerar prompts
    system_prompt, user_prompt = PromptManager.get_analysis_prompt(
        analysis_type=a_type,
        plant_name=plant.name,
        plant_stage=plant.stage,
        location=plant.location,
        extra_info=extra_info,
    )

    # Chamar IA via Gateway
    logger.info(f"📸 Análise de imagem: planta={plant.name}, tipo={a_type.value}")
    ai_response = await ai_gateway.analyze_image(
        image_bytes=image_bytes,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )

    if not ai_response.success:
        raise HTTPException(
            status_code=503,
            detail=f"Falha na análise IA: {ai_response.error}"
        )

    # Parsear resposta JSON da IA
    try:
        parsed = json.loads(ai_response.content)
    except json.JSONDecodeError:
        # Se a IA não retornou JSON válido, criar estrutura básica
        parsed = {
            "health_status": "unknown",
            "confidence": 0,
            "diagnosis": {"primary_issue": "Erro ao parsear resposta", "category": "healthy", "severity": "none", "details": ai_response.content},
            "observations": [],
            "recommendations": [],
            "nutrients": {},
        }

    # Salvar no banco
    analysis = Analysis(
        plant_id=plant.id,
        analysis_type=a_type.value,
        image_path=str(filename),
        health_status=parsed.get("health_status", "unknown"),
        confidence=parsed.get("confidence", 0),
        diagnosis=parsed.get("diagnosis", {}),
        observations=parsed.get("observations", []),
        recommendations=parsed.get("recommendations", []),
        nutrients=parsed.get("nutrients", {}),
        raw_response=ai_response.content,
        ai_provider=ai_response.provider,
        ai_model=ai_response.model,
        latency_ms=ai_response.latency_ms,
        tokens_used=ai_response.tokens_used,
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    logger.info(
        f"✅ Análise #{analysis.id} concluída: "
        f"saúde={analysis.health_status}, confiança={analysis.confidence}%, "
        f"provedor={ai_response.provider}"
    )

    return analysis


@router.get("/history/{plant_id}", response_model=list[AnalysisResponse])
async def get_analysis_history(
    plant_id: int,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Retorna histórico de análises de uma planta."""
    result = await db.execute(
        select(Analysis)
        .where(Analysis.plant_id == plant_id)
        .order_by(Analysis.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/latest/{plant_id}", response_model=AnalysisResponse)
async def get_latest_analysis(
    plant_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retorna a análise mais recente de uma planta."""
    result = await db.execute(
        select(Analysis)
        .where(Analysis.plant_id == plant_id)
        .order_by(Analysis.created_at.desc())
        .limit(1)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Nenhuma análise encontrada")
    return analysis


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: int, db: AsyncSession = Depends(get_db)):
    """Retorna detalhes de uma análise específica."""
    result = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Análise não encontrada")
    return analysis
