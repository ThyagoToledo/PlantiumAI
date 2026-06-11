---
tags: [documentation, template, readme]
updated: 2026-06-10
---

## Definição

Estrutura padrão de README reutilizável em qualquer projeto para documentação clara, visual e bem-organizada.

## Contexto

README é o primeiro contato do usuário com o projeto. Deve ser legível, ter visual atrativo e navegar para documentação detalhada. Essa estrutura garante consistência e profissionalismo.

## Estrutura Recomendada

### 1. Header Visual
- Logo do projeto (centralized, com estilos)
- Badges de tecnologias (shields.io)
- Descrição breve (1-3 linhas)

```markdown
<p align="center">
  <img src="Icons/Logo.png" alt="Project Logo" width="350px" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tech-Version?style=for-the-badge&logo=..." />
</p>

Uma frase que resume o projeto.
```

### 2. Estrutura do Projeto
- Árvore de diretórios com emojis
- Comentários breves explicando cada pasta
- Máximo 2 níveis de profundidade (legível)

```markdown
## Estrutura do Projeto

projeto/
├── 📁 Icons/          # Imagens
├── 📁 doc/            # Documentação
├── 📁 cmd/            # Entry points
├── 📄 README.md
```

### 3. Hub de Documentação
- Links para documentação modularizada em `doc/`
- Cada link com 1-2 linhas de contexto
- Não incluir conteúdo detalhado no README (deixar em `doc/`)

```markdown
## Hub de Documentação

- **[Funcionalidades](doc/features.md)**: Detalhes de execução
- **[Arquitetura](doc/architecture.md)**: Diagrama e design
- **[Guia Dev](doc/development.md)**: Setup local e deploy
```

### 4. Quick Start
- Instruções mínimas para rodar localmente
- Múltiplos sistemas operacionais (Windows, Linux, macOS)
- Variáveis de ambiente necessárias

```markdown
## Quick Start

### Execução Local
export VAR="value"
command run
```

### 5. Autores (Opcional)
- Tabela com avatares GitHub
- Links para perfis

```markdown
## Autores

<table>
  <tr>
    <td><a href="https://github.com/user">
      <img src="https://github.com/user.png" width="100px;"/>
      <sub><b>Name</b></sub></a>
    </td>
  </tr>
</table>
```

### 6. Licença (Rodapé)
- Menção breve com link para arquivo
- Formato: "Sob licença MIT. Veja LICENSE para detalhes."

## Padrões de Estilo

- Separadores: `---` (3 hífens)
- Títulos principais: `## Título`
- Subtítulos: `### Subtítulo`
- Blocos de código: ` ``` ``` `
- Emojis apenas em árvore de diretórios (não em texto)
- Centralizar imagens: `<p align="center">`

## Documentação Modularizada

Estrutura `doc/` recomendada:
- `funcionalidades.md` ou `features.md` - O que faz
- `arquitetura.md` ou `architecture.md` - Como funciona
- `desenvolvimento.md` ou `development.md` - Como rodar/contribuir
- `readme_standards.md` - Padrões do projeto (opcional)

## Benefícios

- Profissionalismo: Layout visual atraente
- Clareza: Estrutura hierárquica óbvia
- Reutilizabilidade: Mesmo padrão em vários projetos
- Manutenibilidade: Documentação modularizada fácil de atualizar
- Navegar fácil: Links para docs detalhadas, não párrafos longos

## Links

- [[workflows/criar-readme]]
