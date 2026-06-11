"""
PlantiuIA — Memory Manager
Sistema de memória persistente para o agente autônomo (estilo Sol Biodome).
Comprime experiências em resumos para manter contexto ao longo do tempo.
"""

import json
from datetime import datetime
from pathlib import Path
from loguru import logger
from config import DATA_DIR


MEMORY_FILE = DATA_DIR / "agent_memory.json"


class MemoryManager:
    """
    Gerencia a memória de longo prazo do agente autônomo.
    
    Inspirado no Sol Biodome:
    - Loops curtos de raciocínio (cada análise)
    - Compressão periódica em resumos
    - Contexto mantido ao longo de semanas/meses
    """

    def __init__(self, max_short_term: int = 50, max_summaries: int = 100):
        self.max_short_term = max_short_term
        self.max_summaries = max_summaries
        self.short_term: list[dict] = []
        self.summaries: list[dict] = []
        self.facts: dict[str, str] = {}
        self._load()

    def _load(self):
        """Carrega memória do disco."""
        if MEMORY_FILE.exists():
            try:
                data = json.loads(MEMORY_FILE.read_text(encoding="utf-8"))
                self.short_term = data.get("short_term", [])
                self.summaries = data.get("summaries", [])
                self.facts = data.get("facts", {})
                logger.info(f"🧠 Memória carregada: {len(self.short_term)} recentes, {len(self.summaries)} resumos")
            except Exception as e:
                logger.warning(f"⚠️ Erro ao carregar memória: {e}")

    def _save(self):
        """Persiste memória no disco."""
        data = {
            "short_term": self.short_term[-self.max_short_term:],
            "summaries": self.summaries[-self.max_summaries:],
            "facts": self.facts,
            "updated_at": datetime.utcnow().isoformat(),
        }
        MEMORY_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def add_observation(self, category: str, content: str, metadata: dict = None):
        """Registra uma observação na memória de curto prazo."""
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "category": category,
            "content": content,
            "metadata": metadata or {},
        }
        self.short_term.append(entry)

        # Comprimir se atingiu o limite
        if len(self.short_term) >= self.max_short_term:
            self._compress()

        self._save()

    def add_fact(self, key: str, value: str):
        """Armazena um fato persistente (ex: 'planta_preferida_umidade': '50%')."""
        self.facts[key] = value
        self._save()

    def _compress(self):
        """Comprime observações recentes em um resumo."""
        if len(self.short_term) < 10:
            return

        # Pegar as observações mais antigas para comprimir
        to_compress = self.short_term[:self.max_short_term // 2]
        self.short_term = self.short_term[self.max_short_term // 2:]

        # Agrupar por categoria
        categories = {}
        for entry in to_compress:
            cat = entry["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(entry["content"])

        summary_parts = []
        for cat, items in categories.items():
            summary_parts.append(f"[{cat}]: {'; '.join(items[-5:])}")

        summary = {
            "period_start": to_compress[0]["timestamp"],
            "period_end": to_compress[-1]["timestamp"],
            "entry_count": len(to_compress),
            "summary": " | ".join(summary_parts),
            "compressed_at": datetime.utcnow().isoformat(),
        }

        self.summaries.append(summary)
        logger.info(f"🗜️ Memória comprimida: {len(to_compress)} observações → 1 resumo")

    def get_context(self, max_entries: int = 10) -> str:
        """Retorna contexto formatado para incluir em prompts da IA."""
        parts = []

        # Fatos persistentes
        if self.facts:
            facts_str = ", ".join(f"{k}: {v}" for k, v in list(self.facts.items())[-10:])
            parts.append(f"FATOS CONHECIDOS: {facts_str}")

        # Resumos recentes
        if self.summaries:
            for s in self.summaries[-3:]:
                parts.append(f"RESUMO ({s['period_start'][:10]}): {s['summary']}")

        # Observações recentes
        if self.short_term:
            recent = self.short_term[-max_entries:]
            for r in recent:
                parts.append(f"[{r['timestamp'][11:16]}] {r['category']}: {r['content']}")

        return "\n".join(parts) if parts else "Nenhum histórico disponível."

    def clear(self):
        """Limpa toda a memória."""
        self.short_term = []
        self.summaries = []
        self.facts = {}
        self._save()
        logger.info("🗑️ Memória limpa")


# Singleton
memory = MemoryManager()
