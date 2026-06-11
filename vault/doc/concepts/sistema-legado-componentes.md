---
tags: [legacy, reuse, plantiumai]
updated: 2026-06-10
---

## Definição

Inventário dos componentes do `SistemaLegado/` (Python/FastAPI + JS vanilla) reaproveitáveis no novo sistema desktop.

## Stack Legada

- Backend: Python 3.13, FastAPI, SQLAlchemy async, SQLite (aiosqlite)
- IA: AI Gateway multi-provider (Claude, GPT, Gemini, Ollama, SmolLM3 GGUF local via llama-cpp)
- Frontend: HTML/CSS/JS vanilla
- Sem comunicação serial real — sensores apenas simulados via API

## Componentes Reaproveitáveis (alta prioridade)

- `services/sensor_service.py`: faixas de validação (VALID_RANGES por sensor), classificação de umidade (dry/low/optimal/high/saturated), geração de alertas com thresholds, simulador realista (variação gradual + hora do dia)
- `core/circuit_breaker.py`: Circuit Breaker completo (CLOSED/OPEN/HALF_OPEN, failure threshold, recovery timeout)
- `services/irrigation_service.py`: decisão híbrida IA + fallback por regras (rule_based_decision com 4 níveis de urgência)
- `models/schemas.py`: schemas Pydantic (Plant, SensorReading, Analysis) — base para modelos de dados do novo sistema
- `core/ai_gateway.py` + `providers/`: arquitetura multi-provider com failover

## Faixas de Sensores (VALID_RANGES)

- soil_moisture: 0-100 % | air_temperature: -10 a 60 °C | air_humidity: 0-100 %
- light_level: 0-150000 lux | soil_temperature: -5 a 50 °C | co2_level: 200-2000 ppm | ph_level: 0-14

## Thresholds de Negócio

- Umidade ideal default: 35-65 %
- Crítico seco: < ideal_min * 0.5 | Encharcado: > ideal_max * 1.2
- Irrigação crítica: < ideal_min * 0.6 (25 min) | média: < ideal_min (15 min)

## Não Reaproveitar

- Frontend vanilla (substituído por UI premium)
- Scripts instalar.bat/.sh (substituídos por instalador nativo)
- venv/ e __pycache__ (artefatos)

## Links

- [[external_cache/especificacao-plantiumai]]
- [[concepts/novo-sistema-arquitetura]]
