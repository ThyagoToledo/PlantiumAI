# PlantiumAI

<p align="center">
  <img src="desktop/src-tauri/icons/icon.png" alt="PlantiumAI Logo" width="160px" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri_2-24C8D8?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32" />
</p>

Sistema inteligente de monitoramento para micro estufas de hortas verticais em
containers. App desktop nativo (Windows/Linux) que ingere, processa e visualiza
em tempo real os dados de sensores enviados por uma ESP32 — com alertas,
decisão de irrigação e gerenciador de dependências embutido.

---

## Estrutura do Projeto

```
PlantiumIA/
├── 📁 desktop/                  # App desktop (Tauri 2 + React + TS)
│   ├── src/                     # Frontend (dashboard, conexão, dependências)
│   └── src-tauri/               # Núcleo nativo Rust (serial, SQLite, domínio)
├── 📁 firmware/                 # Firmware ESP32 (NDJSON @ 115200 baud)
│   └── esp32_plantium/
├── 📁 SistemaLegado/            # Sistema anterior (FastAPI) — fonte das regras portadas
├── 📁 documentos de referencia do projeto/  # Especificação, TCC, planilhas
├── 📁 vault/doc/                # Base de conhecimento (cache otimizado p/ IA)
└── 📁 .github/workflows/        # CI: build nativo Windows + Linux
```

---

## Hub de Documentação

- **[App Desktop](desktop/README.md)**: arquitetura, desenvolvimento, build nativo e protocolo ESP32
- **[Vault — Mapa de Conteúdo](vault/doc/00_MOC.md)**: decisões de arquitetura, componentes do legado, especificação resumida
- **[Firmware ESP32](firmware/esp32_plantium/esp32_plantium.ino)**: exemplo com DHT22 + sensor capacitivo de solo

---

## Quick Start

### UI em modo demo (sem hardware, sem Rust)

```bash
cd desktop
npm install
npm run dev        # abre em http://localhost:5173 com simulador embutido
```

### App nativo (requer Rust)

```bash
winget install Rustlang.Rustup    # Windows
cd desktop
npm run tauri dev                 # desenvolvimento
npm run tauri build               # gera .msi/.exe (Windows) ou AppImage/.deb (Linux)
```

### ESP32

1. Grave `firmware/esp32_plantium/esp32_plantium.ino` (Arduino IDE/PlatformIO)
2. No app: aba **Dependências** → instale o driver do chip (CH340/CP210x)
3. Aba **Conexão** → selecione a porta → **Conectar ESP32**

---

Projeto acadêmico (TCC) e candidato ao Edital Desafio AgroStartup 2026.
