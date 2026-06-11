---
tags: [architecture, desktop, tauri, iot, decision]
updated: 2026-06-10
---

## Definição

Decisão arquitetural do novo sistema desktop PlantiumAI: Tauri 2 (Rust core) + frontend web moderno, compilado nativo para Windows e Linux.

## Stack Escolhida

- Shell/Core: Tauri 2.x (Rust)
- Frontend: React + TypeScript + Vite + Tailwind CSS + ECharts (gráficos)
- Serial: crate `serialport` / `tokio-serial` (USB-UART com ESP32)
- MQTT: crate `rumqttc` (telemetria Wi-Fi)
- Persistência: SQLite via `sqlx` (Rust, async)
- Build: `tauri build` → .exe/.msi (Windows), AppImage/.deb (Linux)

## Por Que Tauri (vs alternativas)

- Electron: empacota Chromium+Node (~150MB+, alto RAM) — rejeitado
- Flutter Desktop: bom, mas ecosistema serial/MQTT desktop imaturo e charts inferiores
- Qt/C++: licenciamento + produtividade baixa + UI datada sem QML avançado
- Go+Fyne: UI não atinge nível premium
- Tauri: binário 5-15MB, webview do SO, Rust = performance + segurança de memória para I/O serial

## Fluxo de Dados

ESP32 → (Serial USB ou MQTT) → thread Rust dedicada (tokio) → parser/validação → broadcast channel → (1) SQLite (persistência) + (2) Tauri events → UI React (gráficos real-time)

UI nunca bloqueia: toda I/O em tasks async no core Rust.

## Gerenciador de Dependências Embutido

- UI: dropdown OS (Windows/Linux) + botão "Baixar Dependências"
- Windows: download drivers USB-UART (CP210x Silicon Labs / CH340) + execução instalador
- Linux: regra udev + adição ao grupo dialout (com pkexec), sem download de driver (kernel já tem)
- Manifesto JSON versionado com URLs + checksums SHA256
- Progresso via Tauri events

## Links

- [[concepts/sistema-legado-componentes]]
- [[external_cache/especificacao-plantiumai]]
