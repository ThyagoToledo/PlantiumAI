---
tags: [readme, system]
updated: 2026-06-10
---

# Vault – Sistema de Documentação Otimizado para IA

Base de conhecimento local com estrutura minimalista focada em economia de tokens.

## Estrutura

```
vault/doc/
├── 00_MOC.md              ← COMECE AQUI
├── concepts/              ← Notas atômicas (1 assunto/arquivo)
├── workflows/             ← Guias passo-a-passo
├── external_cache/        ← Resumos de pesquisas & APIs
└── archive/               ← Conteúdo obsoleto
```

## Fluxo Obrigatório

**Sempre que eu (Claude) receber uma tarefa:**

1. **Check Local First**
   - Leia `00_MOC.md`
   - Se a informação existe, consuma apenas o arquivo específico

2. **Evite Redundância**
   - Não releia o vault inteiro
   - Busque apenas o arquivo necessário

3. **Busca Externa + Cache**
   - Se não existir, pesquise na internet
   - Resuma e salve em `concepts/` ou `external_cache/`
   - Atualize o `00_MOC.md`

4. **Escrita Econômica**
   - Bullets, sem prosa
   - Direto ao ponto
   - Código limpo e focado

## Padrões de Nota

### Concept (Atômico)

```yaml
---
tags: [tag1, tag2]
updated: 2026-06-10
---

## Definição
Uma frase clara.

## Contexto
Quando aplicável.

## Detalhes
- Ponto 1
- Ponto 2

## Links
- [[outro-conceito]]
```

### Workflow

```yaml
---
tags: [workflow]
updated: 2026-06-10
---

## Objetivo
O que faz.

## Passos
1. Fazer X
2. Fazer Y

## Validação
Como verificar.
```

### External Cache

```yaml
---
tags: [external]
updated: 2026-06-10
source: https://url
---

## Resumo
O que é, 1-2 linhas.

## Pontos-Chave
- Ponto 1
```

## Regras de Ouro

✓ Uma ideia = um arquivo
✓ Definição + bullets
✓ Sem prosa introdutória/conclusiva
✓ Links sempre atualizados
✓ Datas em `updated:`
✓ Tags relevantes

✗ Markdown decorativo (bold, cores)
✗ Listas aninhadas
✗ Emoji
✗ Textos longos

## Manutenção

- **Semanal:** Review fleeting notes (em _fleeting/ se existir)
- **Mensal:** Atualizar datas, verificar links quebrados
- **Trimestral:** Archive obsoleto, merge duplicatas

## Economia de Tokens

Exemplo:
- Pergunta 1: "O que é X?" → Pesquisa + síntese = 5k tokens
- Salva: `concepts/x.md`
- Pergunta 2: "Me explique X de novo" → Lê vault = 200 tokens
- **Economia:** 96%

Com 100 topics e 3-5 perguntas cada, redução de milhões de tokens.

---

Leia `00_MOC.md` para começar.
