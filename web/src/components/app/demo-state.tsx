"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  buildSensor,
  buildStats,
  computeHealth,
  genData,
  INITIAL_ALERTS,
  INITIAL_LOCAIS,
  INITIAL_READING,
  INITIAL_SENSORES,
  INITIAL_SETTINGS,
  clamp,
  type Alert,
  type Local,
  type Period,
  type Reading,
  type Settings,
} from "@/lib/plantium-demo";

type PanelKind = "help" | "data" | "addLocal" | "profile" | null;

type DemoCtx = {
  theme: string; isDark: boolean; toggleTheme: () => void;
  collapsed: boolean; setCollapsed: (f: (c: boolean) => boolean) => void;
  drawer: boolean; setDrawer: (v: boolean | ((d: boolean) => boolean)) => void;
  panel: PanelKind; setPanel: (p: PanelKind) => void; closeAll: () => void;
  toast: string; showToast: (m: string) => void;
  period: Period; setPeriod: (p: Period) => void;
  view: "geral" | "tecnica"; setView: (v: "geral" | "tecnica") => void;
  r: Reading; health: number; secsAgo: number;
  locais: Local[]; addLocal: () => void;
  sensores: typeof INITIAL_SENSORES;
  alertList: Alert[]; activeAlerts: number; resolveAlert: (id: number) => void;
  settings: Settings; toggleSetting: (k: keyof Settings) => void;
  name: string; fullName: string; email: string; role: string; initials: string; signOut: () => void;
  exportReport: (format: "pdf" | "csv") => Promise<void>;
};

const Ctx = createContext<DemoCtx | null>(null);
export const useDemo = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo deve ser usado dentro de DemoProvider");
  return c;
};

export function DemoProvider({
  name,
  email,
  role = "Produtor",
  signOut,
  children,
}: {
  name: string;
  email: string;
  role?: string;
  signOut: () => void;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState("light");
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [panel, setPanel] = useState<PanelKind>(null);
  const [toast, setToast] = useState("");
  const [period, setPeriod] = useState<Period>("24h");
  const [view, setView] = useState<"geral" | "tecnica">("geral");
  const [r, setR] = useState<Reading>(INITIAL_READING);
  const [health, setHealth] = useState(() => computeHealth(INITIAL_READING));
  const [secsAgo, setSecsAgo] = useState(2);
  const [locais, setLocais] = useState<Local[]>(INITIAL_LOCAIS);
  const [alertList, setAlertList] = useState<Alert[]>(INITIAL_ALERTS);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tema (lê preferência após montar p/ evitar mismatch de hidratação).
  useEffect(() => {
    let initial = "light";
    try { initial = localStorage.getItem("plantium-theme") || "light"; } catch { /* noop */ }
    setTheme(initial);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("plantium-theme", theme); } catch { /* noop */ }
  }, [theme]);

  // Tick de simulação ao vivo.
  useEffect(() => {
    const id = setInterval(() => {
      setSecsAgo((prev) => {
        const next = prev + 1;
        if (next >= 8) {
          setR((pr) => {
            const j = (v: number, d: number, lo: number, hi: number) => +clamp(v + (Math.random() * 2 - 1) * d, lo, hi).toFixed(1);
            const nr: Reading = {
              soil: Math.round(clamp(pr.soil + (Math.random() * 5 - 2.4), 30, 66)),
              airT: j(pr.airT, 0.5, 21, 28),
              soilT: j(pr.soilT, 0.35, 19, 26),
              airH: Math.round(clamp(pr.airH + (Math.random() * 4 - 2), 50, 72)),
              lux: Math.round(clamp(pr.lux + (Math.random() * 1400 - 700), 12000, 26000)),
              co2: Math.round(clamp(pr.co2 + (Math.random() * 50 - 25), 600, 900)),
              ph: +clamp(pr.ph + (Math.random() * 0.12 - 0.06), 6.0, 6.9).toFixed(1),
            };
            setHealth(computeHealth(nr));
            return nr;
          });
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const closeAll = useCallback(() => { setPanel(null); setDrawer(false); }, []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  const resolveAlert = useCallback((id: number) => {
    setAlertList((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
    showToast("Alerta resolvido");
  }, [showToast]);
  const toggleSetting = useCallback((k: keyof Settings) => setSettings((prev) => ({ ...prev, [k]: !prev[k] })), []);

  const addLocal = useCallback(() => {
    const g = (id: string) => { const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null; return el ? el.value : ""; };
    const name2 = (g("al-nome") || "").trim() || "Novo local";
    const type = g("al-tipo") || "estufa";
    const unit = (g("al-unidade") || "").trim() || "Unidade SP";
    const nsensors = parseInt(g("al-sensores")) || 6;
    const apiKey = (g("al-apikey") || "").trim();
    const h = 72 + Math.floor(Math.random() * 26);
    const loc: Local = { id: Date.now(), name: name2, type, unit, sensors: nsensors, health: h, status: h >= 80 ? "online" : "atencao", alerts: h >= 80 ? 0 : 1, updated: "agora" };
    setLocais((prev) => [loc, ...prev]);
    setPanel(null);
    showToast(apiKey ? `Local “${name2}” conectado via API` : `Local “${name2}” adicionado`);
  }, [showToast]);

  const exportReport = useCallback(async (format: "pdf" | "csv") => {
    const defs: { key: string; label: string; unit: string; dec: boolean; v: number }[] = [
      { key: "soil", label: "Umidade do solo", unit: "%", dec: false, v: r.soil },
      { key: "airT", label: "Temperatura do ar", unit: "°C", dec: true, v: r.airT },
      { key: "airH", label: "Umidade do ar", unit: "%", dec: false, v: r.airH },
      { key: "co2", label: "CO₂", unit: "ppm", dec: false, v: r.co2 },
      { key: "ph", label: "pH do solo", unit: "", dec: true, v: r.ph },
      { key: "lux", label: "Luminosidade", unit: "lux", dec: false, v: r.lux },
    ];
    const sensors = defs.map((m) => {
      const b = buildSensor(m.key, m.v, m.unit, m.dec);
      return { label: m.label, value: b.val, unit: m.unit, status: b.status };
    });
    const stats = buildStats(genData(period));
    const dl = (blob: Blob, fname: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
    };

    if (format === "csv") {
      const head = "Sensor;Mínimo;Máximo;Média;Desvio;Estado";
      const lines = stats.map((s) => [s.name, s.min, s.max, s.avg, s.std, s.state].join(";"));
      const csv = "﻿" + [head, ...lines].join("\r\n");
      dl(new Blob([csv], { type: "text/csv;charset=utf-8" }), "relatorio-plantiumai.csv");
      showToast("Arquivo CSV exportado");
      return;
    }

    const payload = {
      user: name,
      location: "Estufa Central · SP",
      period,
      generatedAt: new Date().toLocaleString("pt-BR"),
      health: computeHealth(r),
      sensors,
      stats,
      alerts: alertList.filter((a) => !a.resolved).map((a) => ({ sev: a.sev, title: a.title, local: a.local, time: a.time })),
    };
    try {
      const res = await fetch("/api/pdf/relatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      dl(await res.blob(), "relatorio-plantiumai.pdf");
      showToast("Relatório PDF gerado");
    } catch {
      showToast("Falha ao gerar PDF — serviço indisponível");
    }
  }, [r, period, alertList, name, showToast]);

  const firstName = name.split(" ")[0] || "Produtor";
  const initials = ((name.split(/\s+/)[0]?.[0] ?? "") + (name.split(/\s+/)[1]?.[0] ?? "")).toUpperCase() || "P";
  const activeAlerts = alertList.filter((a) => !a.resolved).length;

  const value: DemoCtx = {
    theme, isDark: theme === "dark", toggleTheme,
    collapsed, setCollapsed,
    drawer, setDrawer,
    panel, setPanel, closeAll,
    toast, showToast,
    period, setPeriod, view, setView,
    r, health, secsAgo,
    locais, addLocal,
    sensores: INITIAL_SENSORES,
    alertList, activeAlerts, resolveAlert,
    settings, toggleSetting,
    name: firstName, fullName: name, email, role, initials, signOut,
    exportReport,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
