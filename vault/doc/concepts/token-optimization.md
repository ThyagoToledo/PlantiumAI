---
tags: [ai, llm, optimization]
updated: 2026-06-10
---

## Definição

Estratégia de reduzir custos e latência minimizando tokens processados por LLMs sem degradar qualidade.

## Contexto

Todo input/output em uma API de LLM consome tokens (custo). Documentação local reutilizável reduz requisições redundantes.

## Técnicas

- Local caching: Armazenar sínteses de documentação usada frequentemente
- Structured output: JSON/templates reduzem tokens de saída
- Batch processing: Agrupar múltiplas queries
- Model selection: Escolher modelo menor quando suficiente
- Context reuse: Reusar context window da mesma requisição

## Economia Esperada

- Pergunta recorrente: 95%+ redução (busca 5k tokens → leitura 200 tokens)
- 10 perguntas do tema: 96% menos gasto total

## Links

- [[concepts/vault-system]]
