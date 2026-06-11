# PlantiuIA — Task Tracker

## Fase 1 — Core (MVP)

### Estrutura e Configuração
- [x] Criar estrutura de diretórios do projeto
- [x] Criar requirements.txt com dependências
- [x] Criar .env.example e config.py
- [x] Criar .gitignore

### Backend — Core IA
- [x] Implementar AI Gateway (ai_gateway.py)
- [x] Implementar Circuit Breaker (circuit_breaker.py)
- [x] Implementar Prompt Manager (prompt_manager.py)
- [x] Implementar Memory Manager (memory_manager.py)

### Backend — Provedores de IA
- [x] Implementar base provider (interface)
- [x] Implementar Local Model Provider (GGUF próprio — SmolLM3 3B)
- [x] Implementar Ollama Provider
- [x] Implementar Claude Provider
- [x] Implementar OpenAI Provider
- [x] Implementar Gemini Provider

### Backend — Modelos e Banco
- [x] Criar modelos de banco (database.py)
- [x] Criar schemas Pydantic (schemas.py)
- [x] Criar enumerações (enums.py)

### Backend — Serviços
- [x] Implementar Analysis Service
- [x] Implementar Irrigation Service
- [x] Implementar Sensor Service (simulado)

### Backend — API Routes
- [x] Criar main.py (FastAPI app)
- [x] Rotas de análise de imagem
- [x] Rotas de irrigação
- [x] Rotas de sensores
- [x] Rotas do dashboard
- [x] Rotas de configurações
- [x] Rotas de plantas (CRUD)

### Frontend — Dashboard Web
- [x] Design system CSS (styles.css)
- [x] HTML principal (index.html)
- [x] JavaScript — App principal (app.js)
- [x] JavaScript — Cliente API (api.js)

### Scripts Multiplataforma
- [x] instalar.bat (Windows — dependências + modelo IA)
- [x] instalar.sh (Linux/Mac — dependências + modelo IA)
- [x] iniciar.bat (Windows — executar servidor)
- [x] iniciar.sh (Linux/Mac — executar servidor)

### Documentação
- [x] README.md

### Verificação
- [ ] Testar inicialização do backend
- [ ] Testar dashboard no navegador
- [ ] Validar modelo local GGUF
