# 🌱 PlantiuIA — Sistema Inteligente de IA para Agricultura

Sistema completo de monitoramento agrícola com IA, controle de irrigação inteligente e análise de saúde de plantas por imagem. Inspirado no experimento **Sol Biodome** da Anthropic.

---

## Funcionalidades

- **Análise de Saúde por Imagem** — Upload de foto de folha/planta → IA diagnostica doenças, pragas e deficiências nutricionais
- **Irrigação Inteligente** — Decisão automática de irrigação baseada em umidade do solo, clima e IA
- **Modelo de IA Local Próprio** — SmolLM3 3B (GGUF) com suporte nativo a português, sem precisar de internet
- **Sistema de IA Multi-Provider** — Suporte a modelo local, Ollama, Claude, GPT-4, Gemini com failover inteligente
- **5 Modos de IA** — Local, API, Híbrido, Smart Failover com Circuit Breaker
- **Dashboard em Tempo Real** — Métricas, gráficos, alertas e controles
- **Consulta ao Assistente** — Pergunte qualquer dúvida agrícola à IA
- **Simulação de Sensores** — Teste o sistema sem hardware IoT real
- **Multiplataforma** — Roda em Windows e Linux/Mac

## Stack Tecnológica

| Camada | Tecnologia |
|:---|:---|
| Backend | Python 3.11+ / FastAPI / SQLAlchemy |
| Frontend | HTML5 / CSS3 / JavaScript Vanilla |
| IA Local (Própria) | SmolLM3 3B GGUF via llama-cpp-python |
| IA Local (Alternativa) | Ollama + Llama 3.2 Vision |
| IA Cloud | Anthropic Claude, OpenAI GPT-4o, Google Gemini |
| Banco de Dados | SQLite (dev) / PostgreSQL (prod) |

---

## Instalação Rápida

### Windows
```batch
:: 1. Instalar dependências + baixar modelo de IA
instalar.bat

:: 2. Iniciar servidor
iniciar.bat
```

### Linux / macOS
```bash
# 1. Dar permissão aos scripts
chmod +x instalar.sh iniciar.sh

# 2. Instalar dependências + baixar modelo de IA
./instalar.sh

# 3. Iniciar servidor
./iniciar.sh
```

O servidor inicia em `http://localhost:8000`

### Instalação Manual

```bash
# 1. Criar ambiente virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# 2. Instalar dependências
pip install -r backend/requirements.txt

# 3. Configurar variáveis de ambiente
copy .env.example .env       # Windows
# cp .env.example .env       # Linux/Mac

# 4. Baixar modelo de IA local (SmolLM3 3B — ~2GB)
python -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='bartowski/HuggingFaceTB_SmolLM3-3B-GGUF', filename='HuggingFaceTB_SmolLM3-3B-Q4_K_M.gguf', local_dir='backend/models_ai')"

# 5. Iniciar servidor
cd backend
python main.py
```

---

## Modelo de IA Local

O PlantiuIA inclui seu **próprio modelo de IA** que roda localmente, sem precisar de internet ou APIs externas.

| Propriedade | Valor |
|:---|:---|
| Modelo | SmolLM3 3B (Hugging Face) |
| Formato | GGUF Q4_K_M (quantizado) |
| Tamanho | ~2GB |
| Idioma | Português (nativo), Inglês, Espanhol, etc. |
| Hardware | CPU — não precisa de GPU |
| Contexto | 4096 tokens (configurável até 128K) |

O modelo é baixado automaticamente pelo script `instalar.bat`/`instalar.sh`.

---

## Modos de IA

| Modo | Descrição |
|:---|:---|
| `local_only` | Apenas modelo local GGUF + Ollama. Sem internet necessária |
| `api_only` | Apenas API na nuvem |
| `hybrid_prefer_api` | API primeiro, local como fallback |
| `hybrid_prefer_local` | Local primeiro, API para tarefas complexas |
| `smart_failover` | Circuit breaker automático (recomendado) |

---

## Estrutura do Projeto

```
PlantiuIA/
├── instalar.bat / .sh          # Script de instalação (Windows/Linux)
├── iniciar.bat / .sh           # Script de execução (Windows/Linux)
├── .env                        # Configurações de ambiente
├── backend/
│   ├── main.py                 # Entry point FastAPI
│   ├── config.py               # Configurações globais
│   ├── requirements.txt        # Dependências Python
│   ├── models_ai/              # Modelos GGUF (baixados automaticamente)
│   ├── core/
│   │   ├── ai_gateway.py       # Gateway unificado de IA
│   │   ├── circuit_breaker.py  # Circuit Breaker pattern
│   │   ├── prompt_manager.py   # Templates de prompts
│   │   └── memory_manager.py   # Memória persistente da IA
│   ├── providers/
│   │   ├── local_model_provider.py  # IA Local GGUF (SmolLM3)
│   │   ├── ollama_provider.py       # Ollama
│   │   ├── claude_provider.py       # Anthropic Claude
│   │   ├── openai_provider.py       # OpenAI
│   │   └── gemini_provider.py       # Google Gemini
│   ├── services/
│   │   ├── analysis_service.py      # Lógica de análise
│   │   ├── irrigation_service.py    # Lógica de irrigação
│   │   └── sensor_service.py        # Processamento de sensores
│   ├── api/routes/             # Endpoints da API REST
│   ├── models/                 # Modelos de banco de dados
│   └── data/                   # Banco SQLite + uploads
├── frontend/
│   ├── index.html              # Dashboard principal
│   ├── css/styles.css          # Design system
│   └── js/                     # JavaScript (app.js, api.js)
└── README.md
```

---

## Requisitos do Sistema

- **Python 3.11+**
- **2GB de espaço** para o modelo de IA local
- **4GB+ de RAM** recomendado (o modelo usa ~2GB)
- Windows 10+, Linux ou macOS

## Licença

MIT
