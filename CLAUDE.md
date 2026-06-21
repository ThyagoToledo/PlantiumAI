# PlantiumAI — Regras para agentes de IA

## Base de conhecimento (Brain) primeiro — economia de tokens

A documentação vive no **Brain**, um vault Obsidian compartilhado em repositório
separado (`URSoftware/Brain`), normalmente clonado em `../Brain-main` ou
`Desktop/Brain-main`. O `vault/` local foi removido deste repo — não recriar.

1. Antes de pesquisar fora ou reler código extenso, leia `Brain/doc/00_MOC.md` e abra **só** a nota específica necessária.
2. Pesquisa externa nova → resuma em `Brain/doc/external_cache/` (bullets, sem prosa) usando `TEMPLATE_EXTERNAL.md`.
3. Aprendizado/decisão de arquitetura → nota atômica em `Brain/doc/concepts/` (`TEMPLATE_CONCEPT.md`); processo repetível → `Brain/doc/workflows/` (`TEMPLATE_WORKFLOW.md`).
4. Toda nota nova deve ser linkada no `00_MOC.md` — siga `Brain/doc/workflows/atualizar-moc.md`.
5. Escrita econômica: bullets, 1 ideia por arquivo, sem redundância com o que já existe no Brain.
6. O Brain é um repo git próprio com perfil de commit por PC — commitar/pushar o Brain é uma ação à parte deste projeto.

## Git

- Commits exclusivamente como `ThyagoToledo <thyago10a2007@gmail.com>` (config local já aplicada). Verifique a autoria antes de cada push.
- Conventional Commits em português: `tipo(escopo): descrição`.
- Detalhes de ambiente e workaround de DNS do lab: `Brain/doc/workflows/setup-dev-windows.md`.

## Estrutura

- `web/` — plataforma web (Next.js App Router + Auth.js + Drizzle/Neon). Landing institucional em `/`, app autenticado em `/app`. Deploy na Vercel. Ver `web/README.md` e `web/DEPLOY.md`.
- `desktop/` — app Tauri 2 + React/TS (núcleo Rust em `src-tauri/`). Lê o ESP32 via serial; fonte das regras de domínio (sensores, irrigação).
- `packages/ui` — design system React (`@plantium/ui`), reusado por `web/`.
- `firmware/` — ESP32 (NDJSON @ 115200 baud).
- `design/` — design system e prompts de UI.
- `documentos de referencia do projeto/` — TCC/artigos científicos, planilhas (não evoluir).

> Removidos: `vault/` (migrado para o Brain) e `SistemaLegado/` (FastAPI antigo;
> regras úteis arquivadas em `Brain/doc/concepts/sistema-legado-componentes.md`).
