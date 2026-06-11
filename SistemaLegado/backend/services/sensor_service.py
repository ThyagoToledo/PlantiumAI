"""
PlantiuIA — Sensor Service
Processamento, validação e simulação de leituras de sensores.
"""

import random
from datetime import datetime
from loguru import logger


class SensorService:
    """Serviço de processamento de dados de sensores."""

    # Faixas válidas para cada sensor
    VALID_RANGES = {
        "soil_moisture": (0, 100),       # %
        "air_temperature": (-10, 60),     # °C
        "air_humidity": (0, 100),          # %
        "light_level": (0, 150000),        # lux
        "soil_temperature": (-5, 50),      # °C
        "co2_level": (200, 2000),          # ppm
        "ph_level": (0, 14),               # pH
    }

    @classmethod
    def validate_reading(cls, reading: dict) -> tuple[bool, list[str]]:
        """
        Valida uma leitura de sensor.
        
        Returns:
            (is_valid, list_of_warnings)
        """
        warnings = []

        for field, (min_val, max_val) in cls.VALID_RANGES.items():
            value = reading.get(field)
            if value is not None:
                if not isinstance(value, (int, float)):
                    warnings.append(f"{field}: valor não numérico ({value})")
                elif value < min_val or value > max_val:
                    warnings.append(
                        f"{field}: valor fora da faixa ({value} — "
                        f"esperado {min_val}-{max_val})"
                    )

        is_valid = len(warnings) == 0
        return is_valid, warnings

    @classmethod
    def generate_simulated_reading(
        cls,
        last_reading: dict = None,
    ) -> dict:
        """
        Gera uma leitura simulada realista com variação gradual.
        
        Args:
            last_reading: Última leitura para continuidade (opcional)
        """
        hour = datetime.now().hour

        if last_reading:
            # Variação gradual baseada na última leitura
            base_moisture = (last_reading.get("soil_moisture") or 50) - random.uniform(0.5, 2.0)
            base_temp = (last_reading.get("air_temperature") or 25) + random.uniform(-0.5, 0.5)
            base_humidity = (last_reading.get("air_humidity") or 60) + random.uniform(-2, 2)
        else:
            base_moisture = random.uniform(40, 70)
            base_temp = random.uniform(20, 32)
            base_humidity = random.uniform(45, 75)

        # Hora do dia afeta temperatura
        temp_modifier = 0
        if 10 <= hour <= 16:
            temp_modifier = random.uniform(2, 6)
        elif hour >= 20 or hour <= 5:
            temp_modifier = random.uniform(-3, -1)

        # Luminosidade depende da hora
        if 6 <= hour <= 18:
            light = random.uniform(5000, 80000)
        else:
            light = random.uniform(0, 10)

        reading = {
            "soil_moisture": max(5, min(95, base_moisture)),
            "air_temperature": max(10, min(45, base_temp + temp_modifier)),
            "air_humidity": max(20, min(95, base_humidity)),
            "light_level": light,
            "soil_temperature": max(10, min(40, base_temp + temp_modifier - 3)),
            "co2_level": random.uniform(350, 600),
            "ph_level": random.uniform(5.5, 7.5),
            "source": "simulated",
        }

        return reading

    @staticmethod
    def classify_moisture(moisture: float) -> str:
        """Classifica nível de umidade do solo."""
        if moisture < 20:
            return "dry"
        elif moisture < 35:
            return "low"
        elif moisture <= 65:
            return "optimal"
        elif moisture <= 80:
            return "high"
        else:
            return "saturated"

    @staticmethod
    def get_moisture_alert(
        moisture: float,
        plant_name: str = "Planta",
        ideal_min: float = 35,
        ideal_max: float = 65,
    ) -> dict | None:
        """
        Retorna alerta se umidade está fora do ideal.
        
        Returns:
            dict com severity, title, message ou None se tudo ok
        """
        if moisture < ideal_min * 0.5:
            return {
                "severity": "critical",
                "category": "irrigation",
                "title": f"🚨 Solo criticamente seco — {plant_name}",
                "message": (
                    f"Umidade do solo em {moisture:.0f}% "
                    f"(mínimo ideal: {ideal_min:.0f}%). "
                    f"Irrigação urgente necessária!"
                ),
            }
        elif moisture < ideal_min:
            return {
                "severity": "warning",
                "category": "irrigation",
                "title": f"⚠️ Solo seco — {plant_name}",
                "message": (
                    f"Umidade do solo em {moisture:.0f}% "
                    f"(abaixo do mínimo de {ideal_min:.0f}%). "
                    f"Considere irrigar."
                ),
            }
        elif moisture > ideal_max * 1.2:
            return {
                "severity": "warning",
                "category": "irrigation",
                "title": f"⚠️ Solo encharcado — {plant_name}",
                "message": (
                    f"Umidade do solo em {moisture:.0f}% "
                    f"(acima do máximo de {ideal_max:.0f}%). "
                    f"Verifique a drenagem."
                ),
            }

        return None


# Singleton
sensor_service = SensorService()
