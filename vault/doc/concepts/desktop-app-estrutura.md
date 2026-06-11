---
tags: [desktop, tauri, rust, react, plantiumai]
updated: 2026-06-10
---

## Definição

Estrutura implementada do app desktop PlantiumAI em `desktop/` (Tauri 2 + React + TS).

## Módulos Rust (desktop/src-tauri/src/)

- `domain.rs`: SensorReading, VALID_RANGES, classify_moisture (5 níveis), moisture_alert, process_reading — portado do legado, com testes
- `irrigation.rs`: rule_based_decision (4 urgências) — portado, com testes
- `sim.rs`: simulador (variação gradual + hora do dia)
- `db.rs`: SQLite (rusqlite bundled) em thread dedicada via mpsc; tabelas readings + alerts
- `serial.rs`: list_ports com VID/PID (CH340=1A86:7523, CP210x=10C4:EA60, Espressif=303A), reader NDJSON 115200 baud com backoff até 8s
- `deps.rs`: manifesto de drivers, download+SHA256 (Windows), udev+dialout via pkexec (Linux)
- `lib.rs`: AppState, ingest pipeline, 10 comandos Tauri

## Comandos Tauri

start_simulator, stop_source, list_serial_ports, connect_serial, get_history, irrigation_decision, get_profile, set_profile, deps_manifest, install_dependency

## Eventos (Rust → UI)

- `sensor:reading` (ReadingEvent), `sensor:alert` (Alert), `conn:status` (ConnStatus), `deps:progress` (DepProgress), `sensor:parse_error`

## Frontend (desktop/src/)

- `lib/bridge.ts`: detecta Tauri via `__TAURI_INTERNALS__`; fallback browser = simulador TS (demo sem binário)
- `lib/browserSim.ts`: espelho TS do domínio Rust (manter sincronizado!)
- Páginas: Dashboard (cards+ECharts+alertas+irrigação), Conexão, Dependências (dropdown OS), Configurações (perfil planta)
- ECharts importado modular (echarts/core) — bundle 693KB

## Build

- Frontend: `npm run build` (tsc + vite) — OK
- Nativo: `npm run tauri build` → .msi/.exe/AppImage/.deb
- CI: `.github/workflows/build.yml` (matriz windows-latest + ubuntu-22.04, tauri-action)

## Links

- [[concepts/novo-sistema-arquitetura]]
- [[workflows/setup-dev-windows]]
