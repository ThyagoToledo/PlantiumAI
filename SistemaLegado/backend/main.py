"""
PlantiuIA — API Principal (FastAPI)
Ponto de entrada do backend.
"""

import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Adicionar diretório backend ao path para imports relativos
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from config import settings, BASE_DIR
from models.database import init_db

# Rotas
from api.routes.dashboard import router as dashboard_router
from api.routes.analysis import router as analysis_router
from api.routes.irrigation import router as irrigation_router
from api.routes.sensors import router as sensors_router
from api.routes.plants import router as plants_router
from api.routes.settings_routes import router as settings_router


# --- Configuração do Loguru ---
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
    level="DEBUG" if settings.debug else "INFO",
)
logger.add(
    BASE_DIR / "data" / "plantiu.log",
    rotation="10 MB",
    retention="7 days",
    level="INFO",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialização e encerramento da aplicação."""
    logger.info("🌱 PlantiuIA iniciando...")
    
    # Criar tabelas do banco
    await init_db()
    logger.info("✅ Banco de dados inicializado")
    
    # Log de status
    logger.info(f"🧠 Modo de IA: {settings.ai_mode.value}")
    logger.info(f"🌐 Servidor: http://{settings.server_host}:{settings.server_port}")
    
    yield
    
    logger.info("🛑 PlantiuIA encerrando...")


# --- Criar app FastAPI ---
app = FastAPI(
    title="PlantiuIA",
    description="Sistema Inteligente de IA para Agricultura — Monitoramento, Irrigação e Análise de Saúde de Plantas",
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Servir frontend ---
frontend_dir = BASE_DIR.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

# --- Registrar rotas ---
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["Análise"])
app.include_router(irrigation_router, prefix="/api/irrigation", tags=["Irrigação"])
app.include_router(sensors_router, prefix="/api/sensors", tags=["Sensores"])
app.include_router(plants_router, prefix="/api/plants", tags=["Plantas"])
app.include_router(settings_router, prefix="/api/settings", tags=["Configurações"])


@app.get("/")
async def root():
    """Redirecionar para o dashboard."""
    from fastapi.responses import FileResponse
    index_path = frontend_dir / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {
        "name": "PlantiuIA",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    """Health check do servidor."""
    return {
        "status": "healthy",
        "ai_mode": settings.ai_mode.value,
        "debug": settings.debug,
    }


# --- Entry point ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.debug,
    )
