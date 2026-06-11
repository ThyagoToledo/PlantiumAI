"""
PlantiuIA — Irrigation Service
Lógica centralizada de irrigação inteligente.
"""

import json
from loguru import logger

from core.ai_gateway import ai_gateway
from core.prompt_manager import PromptManager
from core.memory_manager import memory


class IrrigationService:
    """Serviço de irrigação inteligente com decisão por IA."""

    @staticmethod
    async def decide(
        soil_moisture: float,
        air_temperature: float,
        air_humidity: float,
        last_irrigation: str,
        plant_name: str,
        plant_stage: str,
        ideal_moisture_min: float = 35.0,
        ideal_moisture_max: float = 65.0,
        drought_tolerance: str = "moderada",
        water_needs: str = "média",
        weather_forecast: str = "Sem dados meteorológicos disponíveis",
    ) -> dict:
        """
        Consulta a IA para decidir se deve irrigar.
        
        Returns:
            dict com should_irrigate, confidence, reasoning, etc.
        """
        system_prompt, user_prompt = PromptManager.get_irrigation_prompt(
            soil_moisture=soil_moisture,
            air_temperature=air_temperature,
            air_humidity=air_humidity,
            last_irrigation=last_irrigation,
            plant_name=plant_name,
            plant_stage=plant_stage,
            weather_forecast=weather_forecast,
            ideal_moisture_min=ideal_moisture_min,
            ideal_moisture_max=ideal_moisture_max,
            drought_tolerance=drought_tolerance,
            water_needs=water_needs,
        )

        # Adicionar contexto de memória
        memory_context = memory.get_context(max_entries=3)
        if memory_context and memory_context != "Nenhum histórico disponível.":
            user_prompt += f"\n\nHISTÓRICO RECENTE:\n{memory_context}"

        ai_response = await ai_gateway.chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        if not ai_response.success:
            # Fallback: decisão baseada em regras
            logger.warning("⚠️ IA indisponível, usando decisão baseada em regras")
            should_irrigate = soil_moisture < ideal_moisture_min
            return {
                "should_irrigate": should_irrigate,
                "confidence": 60.0,
                "duration_minutes": 15 if should_irrigate else 0,
                "reasoning": (
                    f"Decisão por regra: umidade ({soil_moisture:.1f}%) "
                    f"{'abaixo' if should_irrigate else 'acima'} do mínimo "
                    f"({ideal_moisture_min}%)"
                ),
                "urgency": "medium" if should_irrigate else "none",
                "next_check_minutes": 30,
                "warnings": ["IA indisponível — decisão por regra"],
                "provider": "regra_local",
            }

        # Parsear resposta da IA
        try:
            parsed = json.loads(ai_response.content)
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"Erro ao parsear decisão da IA: {e}")
            should_irrigate = soil_moisture < ideal_moisture_min
            parsed = {
                "should_irrigate": should_irrigate,
                "confidence": 50.0,
                "duration_minutes": 15 if should_irrigate else 0,
                "reasoning": "Erro ao interpretar resposta da IA, usando regra",
                "urgency": "low",
                "next_check_minutes": 30,
                "warnings": ["Resposta da IA não foi parseada corretamente"],
            }

        # Registrar na memória
        decision = "IRRIGAR" if parsed.get("should_irrigate") else "NÃO IRRIGAR"
        memory.add_observation(
            category="irrigation",
            content=(
                f"Decisão para {plant_name}: {decision} "
                f"(umidade solo: {soil_moisture:.1f}%, "
                f"confiança: {parsed.get('confidence', 0)}%)"
            ),
            metadata={
                "plant": plant_name,
                "decision": decision,
                "provider": ai_response.provider,
            },
        )

        parsed["provider"] = ai_response.provider
        return parsed

    @staticmethod
    def rule_based_decision(
        soil_moisture: float,
        ideal_min: float = 35.0,
        ideal_max: float = 65.0,
    ) -> dict:
        """
        Decisão de irrigação simples baseada em regras (sem IA).
        Útil como fallback quando nenhum provedor está disponível.
        """
        if soil_moisture < ideal_min * 0.6:
            return {
                "should_irrigate": True,
                "urgency": "critical",
                "duration_minutes": 25,
                "reasoning": f"Solo criticamente seco ({soil_moisture:.0f}%)",
            }
        elif soil_moisture < ideal_min:
            return {
                "should_irrigate": True,
                "urgency": "medium",
                "duration_minutes": 15,
                "reasoning": f"Solo abaixo do ideal ({soil_moisture:.0f}% < {ideal_min:.0f}%)",
            }
        elif soil_moisture > ideal_max:
            return {
                "should_irrigate": False,
                "urgency": "none",
                "duration_minutes": 0,
                "reasoning": f"Solo úmido o suficiente ({soil_moisture:.0f}%)",
                "warnings": ["Solo acima do ideal, monitorar drenagem"],
            }
        else:
            return {
                "should_irrigate": False,
                "urgency": "none",
                "duration_minutes": 0,
                "reasoning": f"Solo em nível ideal ({soil_moisture:.0f}%)",
            }


# Singleton
irrigation_service = IrrigationService()
