# PlantiumAI Desktop

Aplicativo desktop multiplataforma (Windows/Linux) para ingestão, processamento e
visualização de dados de sensores enviados por uma ESP32. Tauri 2 (Rust) + React +
TypeScript + Tailwind + ECharts.

## Estrutura

```
desktop/
├── src/                      # Frontend React
│   ├── lib/
│   │   ├── bridge.ts         # Ponte Tauri ⇄ browser (fallback demo)
│   │   ├── browserSim.ts     # Simulador TS (espelho do domínio Rust)
│   │   ├── types.ts          # Tipos espelhando os structs Rust
│   │   └── useLiveData.ts    # Hook de dados ao vivo (eventos)
│   ├── components/           # LiveChart (ECharts), StatCard
│   └── pages/                # Dashboard, Conexão, Dependências, Configurações
├── src-tauri/                # Núcleo nativo Rust
│   ├── src/
│   │   ├── domain.rs         # Validação/classificação/alertas (porte do legado)
│   │   ├── irrigation.rs     # Decisão de irrigação por regras (porte do legado)
│   │   ├── sim.rs            # Simulador de sensores (modo demo)
│   │   ├── serial.rs         # Serial NDJSON 115200 + VID/PID + reconexão
│   │   ├── db.rs             # SQLite (readings + alerts)
│   │   ├── deps.rs           # Gerenciador de dependências (drivers/udev)
│   │   └── lib.rs            # Estado, comandos e eventos Tauri
│   ├── tauri.conf.json
│   └── capabilities/default.json
└── package.json
```

## Desenvolvimento

```bash
npm install

# UI no navegador (modo demo, sem Rust): simulador TS embutido
npm run dev

# App nativo (requer Rust: winget install Rustlang.Rustup)
npm run tauri dev
```

## Build nativo

```bash
npm run tauri build
# Windows: src-tauri/target/release/bundle/{msi,nsis}/
# Linux:   src-tauri/target/release/bundle/{appimage,deb}/
```

CI em `.github/workflows/build.yml` compila para Windows e Linux a cada push.

## Protocolo ESP32

NDJSON pela serial USB a 115200 baud — uma linha JSON por leitura:

```json
{"soil_moisture":42.1,"air_temperature":27.3,"air_humidity":61.0,"light_level":18500,"source":"esp32"}
```

Campos ausentes são tolerados. Firmware de exemplo em `../firmware/esp32_plantium/`.

## Testes

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```
