---
tags: [workflow, setup, windows, rust, tauri]
updated: 2026-06-10
---

## Objetivo

Preparar ambiente dev do PlantiumAI desktop nesta máquina Windows.

## Estado da Máquina (2026-06-10)

- Node 22.21.1 + npm 10.9.4: OK
- git 2.54: OK
- Rust 1.96: instalado via `winget install Rustlang.Rustup --silent` (funciona no sandbox)
- cargo em `%USERPROFILE%\.cargo\bin` — NÃO está no PATH do bash; usar `export PATH="$USERPROFILE/.cargo/bin:$PATH"`
- MSVC Build Tools: status incerto — cargo check demora (proc-macros compilam); validar
- Python 3.13 global: OK; Pillow instalado via pip

## Passos

1. `cd desktop && npm install`
2. Frontend dev (demo browser): `npm run dev` → http://localhost:5173
3. App nativo dev: `npm run tauri dev` (requer Rust + WebView2)
4. Build nativo: `npm run tauri build`
5. Testes Rust: `cargo test --manifest-path src-tauri/Cargo.toml`

## Git / GitHub

- Remoto: https://github.com/ThyagoToledo/PlantiumAI.git
- Identidade GLOBAL da máquina é de outra pessoa (kkraties13) — usar config LOCAL do repo: ThyagoToledo / thyago10a2007@gmail.com (já configurado)
- Credencial do Windows Credential Manager: ThyagoToledo (auth correta)
- Histórico remoto antigo (backend na raiz) foi mesclado com `-s ours --allow-unrelated-histories`; legado preservado em SistemaLegado/
- .gitignore exclui: .env, *.gguf (modelo 2GB), *.db, venv/, node_modules/, target/

## Troubleshooting

- Print UTF-8 no Python/Windows falha (cp1252) → `sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')`
- Extrair texto de .docx sem libs: zipfile + regex em word/document.xml
- Ícones Tauri: gerados com Pillow (32/128/256/512 png + icon.ico multi-size) em src-tauri/icons/
- cargo check sem MSVC link.exe falha em proc-macros → instalar VS Build Tools ou usar CI

## Validação (2026-06-10)

- `npm run build` → OK (tsc sem erros, bundle 693KB)
- `cargo check` → OK em 54s (MSVC Build Tools PRESENTES nesta máquina)
- `cargo test` → 5/5 testes passando (domain + irrigation)
- UI demo verificada no browser: dashboard real-time, alertas, decisão de irrigação (25min critical em solo 5%), página dependências com toggle OS
- Preview Claude: porta 5173 conflita com vite manual — usar autoPort + PORT env no vite.config
- `npx tauri build` → OK: exe 5,7MB + MSI + NSIS setup em target/release/bundle/ (NSIS/WiX baixados automaticamente pelo tauri-cli)
