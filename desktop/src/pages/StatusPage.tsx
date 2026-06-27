import { useEffect, useState } from "react";
import { Database, Cpu, ShieldCheck, ShowerHead, RefreshCw } from "lucide-react";
import { invoke } from "../lib/bridge";
import type { SystemHealth, IrrigationLogRow } from "../lib/types";

export default function StatusPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<IrrigationLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchStatus() {
    setLoading(true);
    setError("");
    try {
      const h = await invoke<SystemHealth>("get_system_health");
      setHealth(h);
      const l = await invoke<IrrigationLogRow[]>("get_irrigation_logs", { limit: 15 });
      setLogs(l);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Controles e Resumo */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Visao geral da integridade do hardware, banco de dados e acionamentos locais.
        </p>
        <button
          onClick={fetchStatus}
          className="btn-primary py-1.5 px-3 text-xs"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar Diagnostico
        </button>
      </div>

      {error && (
        <div className="card border-red-950 bg-red-950/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Cards de integridade */}
      {health && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card SQLite */}
          <div className="card flex items-start gap-4">
            <span className="rounded-lg bg-leaf-600/20 p-3 text-leaf-400">
              <Database size={24} />
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Banco de Dados Local
              </h4>
              <p className="text-2xl font-bold">{health.db_size_mb.toFixed(2)} MB</p>
              <p className="text-xs text-gray-400">
                {health.reading_count.toLocaleString("pt-BR")} leituras gravadas
              </p>
            </div>
          </div>

          {/* Card Drivers */}
          <div className="card flex items-start gap-4">
            <span className={`rounded-lg p-3 ${health.drivers_ok ? "bg-leaf-600/20 text-leaf-400" : "bg-amber-600/20 text-amber-400"}`}>
              <ShieldCheck size={24} />
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Drivers de Comunicacao
              </h4>
              <p className="text-2xl font-bold">{health.drivers_ok ? "Instalados" : "Nao Detectados"}</p>
              <p className="text-xs text-gray-400">
                Drivers CH340 / CP210x USB-UART
              </p>
            </div>
          </div>

          {/* Card ESP32 */}
          <div className="card flex items-start gap-4">
            <span className="rounded-lg bg-leaf-600/20 p-3 text-leaf-400">
              <Cpu size={24} />
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Modulo de Sensores (ESP32)
              </h4>
              <p className="text-2xl font-bold">
                {health.last_ts ? "Ativo" : "Aguardando"}
              </p>
              <p className="text-xs text-gray-400">
                {health.last_ts
                  ? `Ultimo sinal: ${new Date(health.last_ts).toLocaleTimeString("pt-BR")}`
                  : "Nenhum sinal recebido"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Log de Irrigacoes */}
      <div className="card space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <ShowerHead size={16} /> Historico Recente de Irrigacoes
        </h3>

        {logs.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum acionamento de irrigacao registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-gray-500 font-semibold">
                  <th className="py-2 px-3">Data/Hora</th>
                  <th className="py-2 px-3">Duracao</th>
                  <th className="py-2 px-3">Modo de Disparo</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-gray-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-overlay/35">
                    <td className="py-2 px-3">
                      {new Date(log.ts).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 px-3 font-semibold text-leaf-400">
                      {log.duration_s} segundos
                    </td>
                    <td className="py-2 px-3">
                      <span className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${
                        log.trigger_type === "auto"
                          ? "bg-purple-900/30 text-purple-300 border border-purple-800/40"
                          : "bg-leaf-900/30 text-leaf-300 border border-leaf-800/40"
                      }`}>
                        {log.trigger_type === "auto" ? "Automatico" : "Manual"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-400">
                      Executado
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
