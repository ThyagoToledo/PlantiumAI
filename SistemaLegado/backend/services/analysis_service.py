"""
PlantiuIA — Analysis Service
Lógica centralizada de análise de imagem e saúde de plantas.
"""

import json
from datetime import datetime
from loguru import logger

from core.ai_gateway import ai_gateway
from core.prompt_manager import PromptManager
from core.memory_manager import memory
from models.enums import AnalysisType


class AnalysisService:
    """Serviço de análise de saúde de plantas."""

    @staticmethod
    async def analyze_plant_image(
        image_bytes: bytes,
        analysis_type: AnalysisType,
        plant_name: str = "Não especificada",
        plant_stage: str = "Não especificado",
        location: str = "Não especificada",
        extra_info: str = "",
    ) -> dict:
        """
        Analisa uma imagem de planta e retorna diagnóstico estruturado.
        
        Returns:
            dict com health_status, diagnosis, observations, recommendations, etc.
        """
        # Gerar prompts
        system_prompt, user_prompt = PromptManager.get_analysis_prompt(
            analysis_type=analysis_type,
            plant_name=plant_name,
            plant_stage=plant_stage,
            location=location,
            extra_info=extra_info,
        )

        # Adicionar contexto da memória
        memory_context = memory.get_context(max_entries=5)
        if memory_context and memory_context != "Nenhum histórico disponível.":
            user_prompt += f"\n\nCONTEXTO HISTÓRICO:\n{memory_context}"

        # Chamar IA
        logger.info(
            f"📸 Análise de imagem: planta={plant_name}, "
            f"tipo={analysis_type.value}"
        )
        ai_response = await ai_gateway.analyze_image(
            image_bytes=image_bytes,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        if not ai_response.success:
            return {
                "success": False,
                "error": ai_response.error,
                "provider": ai_response.provider,
                "latency_ms": ai_response.latency_ms,
            }

        # Parsear resposta
        try:
            parsed = json.loads(ai_response.content)
        except json.JSONDecodeError:
            parsed = {
                "health_status": "unknown",
                "confidence": 0,
                "diagnosis": {
                    "primary_issue": "Erro ao parsear resposta",
                    "category": "healthy",
                    "severity": "none",
                    "details": ai_response.content[:500],
                },
                "observations": [],
                "recommendations": [],
                "nutrients": {},
            }

        # Registrar na memória
        memory.add_observation(
            category="analysis",
            content=(
                f"Análise {analysis_type.value} de {plant_name}: "
                f"saúde={parsed.get('health_status', 'unknown')}, "
                f"confiança={parsed.get('confidence', 0)}%"
            ),
            metadata={
                "plant": plant_name,
                "type": analysis_type.value,
                "provider": ai_response.provider,
            },
        )

        return {
            "success": True,
            "parsed": parsed,
            "provider": ai_response.provider,
            "model": ai_response.model,
            "latency_ms": ai_response.latency_ms,
            "tokens_used": ai_response.tokens_used,
            "raw_content": ai_response.content,
        }

    @staticmethod
    def get_health_summary(analyses: list) -> dict:
        """
        Gera resumo de saúde a partir de múltiplas análises.
        
        Args:
            analyses: Lista de registros de Analysis do banco
            
        Returns:
            dict com estatísticas agregadas
        """
        if not analyses:
            return {
                "total": 0,
                "healthy": 0,
                "attention": 0,
                "critical": 0,
                "avg_confidence": 0,
            }

        healthy = sum(
            1 for a in analyses
            if a.health_status in ("excellent", "good")
        )
        attention = sum(
            1 for a in analyses
            if a.health_status in ("moderate", "poor")
        )
        critical = sum(
            1 for a in analyses
            if a.health_status == "critical"
        )
        avg_conf = sum(a.confidence for a in analyses) / len(analyses)

        return {
            "total": len(analyses),
            "healthy": healthy,
            "attention": attention,
            "critical": critical,
            "avg_confidence": round(avg_conf, 1),
        }


# Singleton
analysis_service = AnalysisService()
