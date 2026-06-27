import { useMemo, useState, useEffect } from "react";
import {
  Droplets,
  Thermometer,
  Wind,
  Sun,
  Leaf,
  FlaskConical,
  CloudFog,
  AlertTriangle,
} from "lucide-react";
import StatCard from "../components/StatCard";
import LiveChart, { type Series } from "../components/LiveChart";
import { invoke, listen } from "../lib/bridge";
import type { Alert, IrrigationDecision, ReadingEvent } from "../lib/types";

const MOISTURE_LABEL: Record<string, string> = {
  dry: "Seco",
  low: "Baixo",
  optimal: "Ideal",
  high: "Alto",
  saturated: "Saturado",
};

function fmt(v: number | null | undefined, digits = 1): string {
  return v == null ? "—" : v.toFixed(digits);
}

interface Props {
  events: ReadingEvent[];
  latest: ReadingEvent | null;
  alerts: Alert[];
}

export default function Dashboard({ events, latest, alerts }: Props) {
  const [decision, setDecision] = useState<IrrigationDecision | null>(null);
  const [decisionError, setDecisionError] = useState("");

  // Estados de irrigacao
  const [showIrrigateModal, setShowIrrigateModal] = useState(false);
  const [irrigating, setIrrigating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const r = latest?.reading;
  const moistureClass = latest?.moisture_class ?? null;

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      unsub = await listen<number>("sensor:auto_irrigate_triggered", (durationS) => {
        setIrrigating(true);
        setTimeLeft(durationS);
      });
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (!irrigating || timeLeft <= 0) return;
    const t = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIrrigating(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [irrigating, timeLeft]);

  const moistureSeries: Series[] = useMemo(
    () => [
      {
        name: "Umidade do solo (%)",
        color: "#22c55e",
        data: events.map((e) => [e.reading.ts, e.reading.soil_moisture ?? NaN]),
      },
      {
        name: "Umidade do ar (%)",
        color: "#38bdf8",
        data: events.map((e) => [e.reading.ts, e.reading.air_humidity ?? NaN]),
      },
    ],
    [events],
  );

  const tempSeries: Series[] = useMemo(
    () => [
      {
        name: "Temp. ar (°C)",
        color: "#f59e0b",
        data: events.map((e) => [e.reading.ts, e.reading.air_temperature ?? NaN]),
      },
      {
        name: "Temp. solo (°C)",
        color: "#a78bfa",
        data: events.map((e) => [e.reading.ts, e.reading.soil_temperature ?? NaN]),
      },
    ],
    [events],
  );

  async function decideIrrigation() {
    setDecisionError("");
    try {
      setDecision(await invoke<IrrigationDecision>("irrigation_decision"));
    } catch (e) {
      setDecision(null);
      setDecisionError(String(e));
    }
  }

  async function handleIrrigate(durationS: number) {
    setShowIrrigateModal(false);
    try {
      await invoke("trigger_irrigation", { durationS });
      setIrrigating(true);
      setTimeLeft(durationS);
    } catch (e) {
      alert("Falha ao acionar irrigacao: " + String(e));
    }
  }

  const moistureAccent =
    moistureClass === "optimal" ? "ok" : moistureClass === "dry" || moistureClass === "saturated" ? "crit" : "warn";

  return (
    <div className="space-y-4">
      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Droplets size={20} />}
          label="Umidade do solo"
          value={`${fmt(r?.soil_moisture, 0)}%`}
          sub={moistureClass ? MOISTURE_LABEL[moistureClass] ?? moistureClass : undefined}
          accent={r ? moistureAccent : "none"}
        />
        <StatCard
          icon={<Thermometer size={20} />}
          label="Temperatura do ar"
          value={`${fmt(r?.air_temperature)}°C`}
          sub={`Solo: ${fmt(r?.soil_temperature)}°C`}
        />
        <StatCard
          icon={<Wind size={20} />}
          label="Umidade do ar"
          value={`${fmt(r?.air_humidity, 0)}%`}
        />
        <StatCard
          icon={<Sun size={20} />}
          label="Luminosidade"
          value={`${fmt(r?.light_level, 0)} lx`}
        />
        <StatCard
          icon={<CloudFog size={20} />}
          label="CO₂"
          value={`${fmt(r?.co2_level, 0)} ppm`}
        />
        <StatCard icon={<FlaskConical size={20} />} label="pH do solo" value={fmt(r?.ph_level)} />
        <StatCard
          icon={<Leaf size={20} />}
          label="Fonte"
          value={r?.source || "—"}
          sub={r ? new Date(r.ts).toLocaleTimeString("pt-BR") : "aguardando dados"}
        />
        <div className="card flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wide text-gray-500">Irrigação</p>
          <div className="mt-2 flex gap-2">
            <button className="btn-primary flex-1 justify-center py-1.5 text-xs" onClick={decideIrrigation} disabled={!r}>
              Avaliar
            </button>
            <button
              className="rounded-lg border border-leaf-600 bg-leaf-950/20 text-leaf-400 hover:bg-leaf-950/40 hover:text-leaf-300 transition-colors text-xs font-medium px-2 py-1.5 flex flex-1 items-center justify-center gap-1.5"
              onClick={() => setShowIrrigateModal(true)}
              disabled={!r || irrigating}
            >
              <Droplets size={14} /> {irrigating ? `${timeLeft}s` : "Irrigar"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Duracao da Irrigacao */}
      {showIrrigateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card w-85 space-y-4 border-surface-border bg-surface-raised p-5 shadow-2xl">
            <h3 className="text-sm font-semibold">Acionar Irrigacao</h3>
            <p className="text-xs text-gray-400">
              Escolha por quanto tempo o rele de agua permanecera ativado.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleIrrigate(10)}
                className="rounded-lg bg-surface-overlay border border-surface-border py-2 text-xs font-medium hover:bg-surface-raised transition-colors"
              >
                10s
              </button>
              <button
                onClick={() => handleIrrigate(30)}
                className="rounded-lg bg-surface-overlay border border-surface-border py-2 text-xs font-medium hover:bg-surface-raised transition-colors"
              >
                30s
              </button>
              <button
                onClick={() => handleIrrigate(60)}
                className="rounded-lg bg-surface-overlay border border-surface-border py-2 text-xs font-medium hover:bg-surface-raised transition-colors"
              >
                1m
              </button>
            </div>
            <button
              onClick={() => setShowIrrigateModal(false)}
              className="w-full rounded-lg border border-surface-border bg-surface-overlay/25 py-2 text-xs font-medium hover:bg-surface-overlay transition-colors text-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Decisão de irrigação */}
      {decisionError && (
        <div className="card border-red-950 bg-red-950/20 text-sm text-red-300">{decisionError}</div>
      )}
      {decision && (
        <div
          className={`card text-sm ${
            decision.should_irrigate
              ? decision.urgency === "critical"
                ? "border-red-800"
                : "border-amber-800"
              : "border-leaf-700"
          }`}
        >
          <p className="font-semibold">
            {decision.should_irrigate
              ? `IRRIGAR — ${decision.duration_minutes} min (urgência: ${decision.urgency})`
              : "NÃO IRRIGAR"}
          </p>
          <p className="mt-1 text-gray-400">{decision.reasoning}</p>
          {decision.warnings.map((w) => (
            <p key={w} className="mt-1 text-amber-400">⚠ {w}</p>
          ))}
          <p className="mt-2 text-xs text-gray-500">decisor: {decision.provider}</p>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-sm font-medium text-gray-400">Umidade — solo × ar</h3>
          <LiveChart series={moistureSeries} unit="%" />
        </div>
        <div className="card">
          <h3 className="mb-2 text-sm font-medium text-gray-400">Temperatura — ar × solo</h3>
          <LiveChart series={tempSeries} unit="°C" />
        </div>
      </div>

      {/* Feed de alertas */}
      <div className="card">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-400">
          <AlertTriangle size={16} /> Alertas recentes
        </h3>
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum alerta. Tudo dentro do ideal.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.slice(0, 8).map((a, i) => (
              <li
                key={`${a.ts}-${i}`}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  a.severity === "critical"
                    ? "border-red-900 bg-red-950/40 text-red-200"
                    : "border-amber-900 bg-amber-950/30 text-amber-200"
                }`}
              >
                <span className="font-medium">{a.title}</span>
                <span className="ml-2 text-xs opacity-70">
                  {new Date(a.ts).toLocaleTimeString("pt-BR")}
                </span>
                <p className="mt-0.5 text-xs opacity-80">{a.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
