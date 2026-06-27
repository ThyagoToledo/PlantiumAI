import { useEffect, useMemo, useState } from "react";
import { Calendar, Download, History, RefreshCw, Table } from "lucide-react";
import { invoke } from "../lib/bridge";
import type { HistoryRow } from "../lib/types";
import LiveChart, { type Series } from "../components/LiveChart";

type Period = "today" | "7d" | "30d" | "custom";

export default function HistoryPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exportPath, setExportPath] = useState("");
  const itemsPerPage = 20;

  const sinceTs = useMemo(() => {
    const now = new Date();
    if (period === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return today.getTime();
    }
    if (period === "7d") {
      return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    }
    if (period === "30d") {
      return now.getTime() - 30 * 24 * 60 * 60 * 1000;
    }
    if (period === "custom" && startDate) {
      return new Date(startDate).getTime();
    }
    return null;
  }, [period, startDate]);

  const untilTs = useMemo(() => {
    if (period === "custom" && endDate) {
      return new Date(endDate).getTime();
    }
    return null;
  }, [period, endDate]);

  async function fetchHistory() {
    setLoading(true);
    setError("");
    try {
      const data = await invoke<HistoryRow[]>("get_history", {
        limit: 1000,
        sinceTs: sinceTs,
      });

      // Filtra por data final se aplicavel
      let filtered = data;
      if (untilTs !== null) {
        filtered = data.filter((row) => row.ts <= untilTs);
      }

      setHistory(filtered);
      setCurrentPage(1);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, [sinceTs, untilTs]);

  async function handleExport() {
    setExportPath("");
    try {
      const path = await invoke<string>("export_history_csv", {
        sinceTs: sinceTs,
      });
      setExportPath(path);
      setTimeout(() => setExportPath(""), 5000);
    } catch (e) {
      alert("Falha ao exportar CSV: " + String(e));
    }
  }

  // Paginacao
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return history.slice(start, start + itemsPerPage);
  }, [history, currentPage]);

  const totalPages = Math.ceil(history.length / itemsPerPage);

  // Series para o grafico
  const chartSeries: Series[] = useMemo(() => {
    const sorted = [...history].reverse();
    return [
      {
        name: "Umidade do solo (%)",
        color: "#22c55e",
        data: sorted.map((h) => [h.ts, h.soil_moisture ?? NaN]),
      },
      {
        name: "Temp. ar (°C)",
        color: "#f59e0b",
        data: sorted.map((h) => [h.ts, h.air_temperature ?? NaN]),
      },
      {
        name: "Umidade do ar (%)",
        color: "#38bdf8",
        data: sorted.map((h) => [h.ts, h.air_humidity ?? NaN]),
      },
    ];
  }, [history]);

  return (
    <div className="space-y-4">
      {/* Controles de Filtro */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar size={16} /> Periodo:
          </span>
          <button
            onClick={() => setPeriod("today")}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              period === "today"
                ? "bg-leaf-600/20 text-leaf-400 border border-leaf-600/30"
                : "bg-surface-overlay text-gray-400 hover:text-gray-200"
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod("7d")}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              period === "7d"
                ? "bg-leaf-600/20 text-leaf-400 border border-leaf-600/30"
                : "bg-surface-overlay text-gray-400 hover:text-gray-200"
            }`}
          >
            Ultimos 7 dias
          </button>
          <button
            onClick={() => setPeriod("30d")}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              period === "30d"
                ? "bg-leaf-600/20 text-leaf-400 border border-leaf-600/30"
                : "bg-surface-overlay text-gray-400 hover:text-gray-200"
            }`}
          >
            Ultimos 30 dias
          </button>
          <button
            onClick={() => setPeriod("custom")}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              period === "custom"
                ? "bg-leaf-600/20 text-leaf-400 border border-leaf-600/30"
                : "bg-surface-overlay text-gray-400 hover:text-gray-200"
            }`}
          >
            Customizado
          </button>

          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="input text-xs"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-xs text-gray-500">ate</span>
              <input
                type="date"
                className="input text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchHistory} className="btn-primary py-1.5" disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg border border-surface-border bg-surface-overlay hover:bg-surface-raised transition-colors text-xs text-gray-300 font-medium px-4 py-2 flex items-center gap-2"
            disabled={history.length === 0}
          >
            <Download size={15} /> Exportar CSV
          </button>
        </div>
      </div>

      {exportPath && (
        <div className="card border-leaf-700 bg-leaf-950/20 text-leaf-300 text-xs py-2">
          Dados exportados com sucesso em: {exportPath}
        </div>
      )}

      {error && <div className="card border-red-950 bg-red-950/20 text-red-400 text-sm">{error}</div>}

      {/* Grafico Temporal */}
      {history.length > 0 && (
        <div className="card">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-400">
            <History size={16} /> Grafico Historico ({history.length} leituras)
          </h3>
          <div className="h-64">
            <LiveChart series={chartSeries} unit="" />
          </div>
        </div>
      )}

      {/* Tabela de Leitura */}
      <div className="card space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Table size={16} /> Leituras Registradas
        </h3>

        {history.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum registro encontrado no periodo selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-gray-500 font-semibold">
                  <th className="py-2 px-3">Data/Hora</th>
                  <th className="py-2 px-3">Umidade Solo</th>
                  <th className="py-2 px-3">Temp. Ar</th>
                  <th className="py-2 px-3">Umidade Ar</th>
                  <th className="py-2 px-3">Temp. Solo</th>
                  <th className="py-2 px-3">Luz</th>
                  <th className="py-2 px-3">CO2</th>
                  <th className="py-2 px-3">pH</th>
                  <th className="py-2 px-3">Fonte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-gray-300">
                {paginatedData.map((row) => (
                  <tr key={row.ts} className="hover:bg-surface-overlay/35">
                    <td className="py-2 px-3">
                      {new Date(row.ts).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 px-3 font-medium">
                      {row.soil_moisture !== null ? `${row.soil_moisture.toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2 px-3">
                      {row.air_temperature !== null ? `${row.air_temperature.toFixed(1)}°C` : "—"}
                    </td>
                    <td className="py-2 px-3">
                      {row.air_humidity !== null ? `${row.air_humidity.toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2 px-3">
                      {row.soil_temperature !== null ? `${row.soil_temperature.toFixed(1)}°C` : "—"}
                    </td>
                    <td className="py-2 px-3">
                      {row.light_level !== null ? `${row.light_level.toFixed(0)} lx` : "—"}
                    </td>
                    <td className="py-2 px-3">
                      {row.co2_level !== null ? `${row.co2_level.toFixed(0)} ppm` : "—"}
                    </td>
                    <td className="py-2 px-3">
                      {row.ph_level !== null ? row.ph_level.toFixed(2) : "—"}
                    </td>
                    <td className="py-2 px-3">
                      <span className="rounded bg-surface-overlay px-1.5 py-0.5 text-[10px] text-gray-400">
                        {row.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginacao */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  Pagina {currentPage} de {totalPages} ({history.length} itens)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded bg-surface-overlay border border-surface-border px-3 py-1 hover:text-gray-200 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded bg-surface-overlay border border-surface-border px-3 py-1 hover:text-gray-200 disabled:opacity-50"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
