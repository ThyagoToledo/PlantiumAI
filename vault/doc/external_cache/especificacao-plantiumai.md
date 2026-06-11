---
tags: [external, spec, plantiumai, iot]
updated: 2026-06-10
source: https://docs.google.com/document/d/1GlikhnXTmol53i5H32Nbh-Ds6i4tINOqrhOaukD_Fps + docx locais
---

## Resumo

Especificação do PlantiumAI: sistema inteligente de monitoramento para micro estufas verticais em containers (IoT + visão computacional + IA). Projeto de TCC + Edital AgroStartup 2026.

## Hardware

- Processamento: ESP32 (Wemos D1), ESP32-CAM, Raspberry Pi 3
- Sensores: DHT22 (temp/umidade ar), umidade solo capacitivo, luminosidade, CO2
- Câmera USB IP67 à prova d'água
- Display local: SSD1306 LCD
- Atuação: válvula solenoide (irrigação automática)

## Comunicação

- MQTT (protocolo principal de telemetria)
- Wi-Fi via ESP32
- LoRa (futuro, múltiplos containers)

## Funcionalidades-Alvo

- Detecção: folhas amareladas, fungos, pragas, estresse hídrico
- Predição: necessidade de irrigação, risco de fungos, temperatura crítica
- Alertas remotos ao produtor (celular)
- Rastreabilidade documental (conformidade ambiental, exportação)

## Decisões Críticas de Escopo

- IA limitada a tarefas específicas (ex: folhas amareladas) — NÃO reconhecimento universal de doenças
- Foco: mudas no início do ciclo vegetativo
- Métrica de sucesso: ROI demonstrável (35% economia de água)
- Modelo de negócio: SaaS + kit físico, piloto R$ 52.940

## Dores que Resolve (IFAG 2026)

- Falta de biossensores para ajuste de irrigação (score 526,9 — dor #1 horticultura)
- Pragas rápidas (471,4), triagem precoce de doenças (254,0)

## Links

- [[concepts/sistema-legado-componentes]]
- [[concepts/novo-sistema-arquitetura]]
