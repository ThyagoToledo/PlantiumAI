---
tags: [esp32, firmware, serial, protocolo]
updated: 2026-06-10
---

## Definição

Protocolo de telemetria entre a ESP32 e o app desktop: NDJSON pela serial USB a 115200 baud.

## Formato do Frame

Uma linha JSON por leitura, terminada em \n:

```json
{"soil_moisture":42.1,"air_temperature":27.3,"air_humidity":61.0,"light_level":18500,"soil_temperature":24.0,"co2_level":480,"ph_level":6.4,"source":"esp32"}
```

- Campos ausentes são tolerados (Option no Rust)
- `source` default "esp32" se omitido
- `ts` preenchido pelo desktop na ingestão

## Identificação USB (VID:PID)

- CH340 (WCH): 1A86:7523 — Wemos D1, clones
- CP210x (Silicon Labs): 10C4:EA60 — DevKits oficiais
- ESP32 USB nativo (Espressif): VID 303A

## Firmware de Exemplo

`firmware/esp32_plantium/esp32_plantium.ino` (Arduino IDE / PlatformIO)
- DHT22 no pino 4, solo capacitivo ADC 34, LDR ADC 35
- Calibração capacitivo: seco ~3200 raw, úmido ~1200 raw
- `#define SIMULATE` para testar sem sensores
- Intervalo: 2000ms

## Links

- [[concepts/desktop-app-estrutura]]
- [[external_cache/especificacao-plantiumai]]
