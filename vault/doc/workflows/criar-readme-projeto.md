---
tags: [workflow, documentation, readme]
updated: 2026-06-10
---

## Objetivo

Criar um README profissional e bem-estruturado para um novo projeto reutilizando o padrão.

## Pré-requisitos

- Projeto configurado
- Logo/imagem do projeto
- Lista de tecnologias usadas
- Estrutura de pastas definida
- Documentação técnica começada em `doc/`

## Passos

1. **Estruture a documentação em `doc/`**
   - `doc/features.md` ou `funcionalidades.md`
   - `doc/architecture.md` ou `arquitetura.md`
   - `doc/development.md` ou `desenvolvimento.md`

2. **Crie o README na raiz do projeto**
   - Copie estrutura de: [[concepts/readme-structure-template]]

3. **Preencha Header Visual**
   - Logo: `<p align="center"><img src="path/to/logo.png" width="350px"/></p>`
   - Badges: Use https://shields.io para techs (Go, Python, AWS, etc)
   - Descrição: 1-3 linhas resumindo o projeto

4. **Adicione Estrutura do Projeto**
   - Árvore de diretórios com emojis
   - Máximo 2 níveis de depth
   - Comentários breves explicando cada pasta

5. **Crie Hub de Documentação**
   - Links para cada arquivo em `doc/`
   - Cada link com 1-2 linhas de contexto
   - Formato: `- **[Título](doc/arquivo.md)**: Descrição`

6. **Adicione Quick Start**
   - Instruções mínimas para rodar localmente
   - Exemplos para Windows, Linux, macOS se aplicável
   - Mostrar variáveis de ambiente necessárias

7. **Adicione Autores (Opcional)**
   - Tabela HTML com avatares GitHub
   - Links para perfis de contribuidores

8. **Rodapé com Licença**
   - Menção breve e link para arquivo LICENSE
   - Exemplo: "Sob licença MIT. Veja LICENSE para detalhes."

## Validação

- [ ] Logo está centralizada e com bom tamanho (300-400px)?
- [ ] Badges aparecem corretamente?
- [ ] Descrição é clara em 1-3 linhas?
- [ ] Estrutura de diretórios é legível?
- [ ] Hub de documentação aponta para arquivos corretos?
- [ ] Quick Start funciona (testado)?
- [ ] Sem conteúdo detalhado no README (deixar em `doc/`)?
- [ ] Separadores `---` usados corretamente?
- [ ] Links para `doc/` funcionam?

## Troubleshooting

- Logo não aparece? → Verificar caminho relativo, usar URL absoluta se em repositório online
- Badges não carregam? → shields.io pode estar fora do ar, tentar novamente
- Styling não funciona? → GitHub suporta inline HTML, usar `<p>`, `<div>`, `<table>`
- Estrutura muito grande? → Dividir em 2+ seções ou usar collapsible sections (`<details>`)
