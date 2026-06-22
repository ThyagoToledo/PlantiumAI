"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useDemo } from "@/components/app/demo-state";
import { EChart } from "@/components/app/echart";
import { buildChartOptions, readThemeColors } from "@/lib/plantium-charts";
import { buildSensor, buildStats, genData, healthInfo } from "@/lib/plantium-demo";
import { WeatherCard } from "@/components/app/weather-card";

const ICONS: Record<string, ReactNode> = {
  soil: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3c4 4.5 6.5 7.7 6.5 11A6.5 6.5 0 0 1 5.5 14C5.5 10.7 8 7.5 12 3z" /></svg>,
  airT: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z" /></svg>,
  airH: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3c4 4.5 6.5 7.7 6.5 11A6.5 6.5 0 0 1 5.5 14C5.5 10.7 8 7.5 12 3z" /></svg>,
  co2: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 14a4 4 0 0 1 .5-7.9A5 5 0 0 1 14 5.5 3.5 3.5 0 0 1 17 14z" /><path d="M8 18h.01M12 19h.01M16 18h.01" /></svg>,
  ph: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4v9a4 4 0 0 0 8 0V4" /><path d="M3 4h12" /><path d="M19 5v6M16 8h6" /></svg>,
  lux: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></svg>,
};

function SensorCard({ id, label, val, unit, sensor }: { id: string; label: string; val: string; unit: string; sensor: ReturnType<typeof buildSensor> }) {
  return (
    <div className="pl-card pl-card--solid pl-sensor" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="pl-kpi__icon" style={{ width: 34, height: 34, background: sensor.tint, color: sensor.col }}>{ICONS[id]}</span>
        <span className={"pl-chip " + sensor.chip}>{sensor.status}</span>
      </div>
      <span style={{ fontSize: 13, color: "var(--pl-text-muted)" }}>{label}</span>
      <span className="pl-font-display" style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{val}{unit && <span style={{ fontSize: 16, color: "var(--pl-text-faint)", fontWeight: 600 }}> {unit}</span>}</span>
      <svg viewBox="0 0 120 30" preserveAspectRatio="none" style={{ width: "100%", height: 26 }}><polyline points={sensor.spark} fill="none" stroke={sensor.col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <div style={{ height: 6, borderRadius: 999, background: "var(--pl-surface-raised)", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 999, background: sensor.col, width: sensor.pctW, transition: "width .6s ease" }} /></div>
    </div>
  );
}

export default function DashboardPage() {
  const { name, period, setPeriod, view, setView, r, health, secsAgo, theme, alertList, setPanel, exportReport } = useDemo();

  const So = buildSensor("soil", r.soil, "%", false);
  const AT = buildSensor("airT", r.airT, "°C", true);
  const AH = buildSensor("airH", r.airH, "%", false);
  const CO = buildSensor("co2", r.co2, "ppm", false);
  const PH = buildSensor("ph", r.ph, "", true);
  const LX = buildSensor("lux", r.lux, "lux", false);
  const hi = healthInfo(health);
  const ringOffset = 484 * (1 - health / 100);
  const ringColor = health >= 85 ? "#34d977" : health >= 65 ? "#f59e0b" : "#ef4444";
  const irrigWidth = 38 + (secsAgo / 8) * 52;

  const stats = useMemo(() => buildStats(genData(period)), [period]);
  const recent = alertList.filter((a) => !a.resolved).slice(0, 3);

  // Opções dos gráficos (client-side; lê CSS vars). Recalcula em período/tema/visão.
  const [opts, setOpts] = useState<Record<string, object>>({});
  useEffect(() => {
    setOpts(buildChartOptions(period, r, readThemeColors()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, theme, view]);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* HEADER + VIEW SWITCH */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 className="pl-font-display pl-page-title" style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-.01em" }}>Olá, {name}</h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--pl-text-muted)" }}>Estufa Central · Unidade SP — <span className="pl-chip pl-chip--ideal" style={{ fontSize: 11 }}><span className="pl-chip__dot" style={{ animation: "pl-pulse 1.6s infinite" }} />ao vivo · atualizado há {secsAgo}s</span></p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div className="pl-period" role="tablist">
            <button className={"pl-period__item " + (view === "geral" ? "pl-period__item--active" : "")} onClick={() => setView("geral")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>Visão geral
            </button>
            <button className={"pl-period__item " + (view === "tecnica" ? "pl-period__item--active" : "")} onClick={() => setView("tecnica")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 18V9M9 18V5M14 18v-6M19 18V8" /></svg>Visão técnica
            </button>
          </div>
          <div className="pl-period" role="tablist">
            {(["12h", "24h", "Semana"] as const).map((p) => (
              <button key={p} className={"pl-period__item " + (period === p ? "pl-period__item--active" : "")} onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div id="pl-hero" className="pl-anim" style={{ display: "grid", gridTemplateColumns: "minmax(330px,0.85fr) 1.15fr", gap: 18, alignItems: "stretch" }}>
        {/* HEALTH CARD */}
        <div className="pl-card pl-card--feature" style={{ background: "linear-gradient(155deg,#10241a 0%,#0b1812 100%)", border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", gap: 18, color: "#eaf3ee" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#9fb4a8" }}>Saúde da estufa</span>
            <span className={"pl-chip " + hi.c}><span className="pl-chip__dot" />{hi.l}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div className="pl-gauge" style={{ width: 168, height: 168, flexShrink: 0 }}>
              <svg width="168" height="168" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="84" cy="84" r="77" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="14" />
                <circle cx="84" cy="84" r="77" fill="none" stroke={ringColor} strokeWidth="14" strokeLinecap="round" strokeDasharray="484" strokeDashoffset={ringOffset} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.4,0,.2,1),stroke .4s ease" }} />
              </svg>
              <div className="pl-gauge__center">
                <span className="pl-gauge__value" style={{ fontSize: 48, color: "#eaf3ee" }}>{health}<span style={{ fontSize: 22, color: "#9fb4a8" }}>%</span></span>
                <span className="pl-gauge__label" style={{ color: "#9fb4a8" }}>Índice geral</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1, minWidth: 140 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 13, color: "#9fb4a8" }}>Sensores online</span><span className="pl-font-display" style={{ fontSize: 18, fontWeight: 700 }}>25<span style={{ color: "#6c8478", fontSize: 13 }}>/28</span></span></div>
              <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 13, color: "#9fb4a8" }}>Offline</span><span className="pl-chip pl-chip--critico">3 nós</span></div>
              <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 13, color: "#9fb4a8" }}>Alertas ativos</span><span className="pl-chip pl-chip--atencao">{alertList.filter((a) => !a.resolved).length}</span></div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#eaf3ee" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d977" strokeWidth="2" strokeLinejoin="round"><path d="M12 3c4 4.5 6.5 7.7 6.5 11A6.5 6.5 0 0 1 5.5 14C5.5 10.7 8 7.5 12 3z" /></svg>
                Irrigação · decisão na borda
              </span>
              <span className="pl-chip pl-chip--atencao">urgência média</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: irrigWidth + "%", borderRadius: 999, background: "linear-gradient(90deg,#22c55e,#34d977)", transition: "width .9s ease" }} />
            </div>
          </div>
        </div>

        {/* SENSOR CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(168px,1fr))", gap: 14, alignContent: "start" }}>
          <SensorCard id="soil" label="Umidade do solo" val={So.val} unit={So.unit} sensor={So} />
          <SensorCard id="airT" label="Temperatura do ar" val={AT.val} unit={AT.unit} sensor={AT} />
          <SensorCard id="airH" label="Umidade do ar" val={AH.val} unit={AH.unit} sensor={AH} />
          <SensorCard id="co2" label="CO₂" val={CO.val} unit={CO.unit} sensor={CO} />
          <SensorCard id="ph" label="pH do solo" val={PH.val} unit="" sensor={PH} />
          <SensorCard id="lux" label="Luminosidade" val={LX.val} unit={LX.unit} sensor={LX} />
        </div>
      </div>

      {/* GERAL */}
      {view === "geral" && (
        <div className="pl-stack2" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
          <div className="pl-card pl-card--solid" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span className="pl-font-display" style={{ fontSize: 16, fontWeight: 600 }}>Índice de saúde — {period}</span><span style={{ fontSize: 12, color: "var(--pl-text-muted)" }}>% das condições dentro da faixa ideal</span></div>
              <span className="pl-chip pl-chip--ideal">↑ estável</span>
            </div>
            <EChart option={opts.trend ?? {}} height={240} />
          </div>
          <div className="pl-card pl-card--solid" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}><span className="pl-font-display" style={{ fontSize: 16, fontWeight: 600 }}>Alertas recentes</span><span className="pl-login__link" style={{ cursor: "default" }}>Ver todos</span></div>
            {recent.map((al, i) => (
              <div key={al.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderTop: i === 0 ? "none" : "1px solid var(--pl-border-subtle)" }}>
                <span className={"pl-chip " + (al.sev === "Crítico" ? "pl-chip--critico" : "pl-chip--atencao")} style={{ flexShrink: 0 }}>{al.sev}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}><span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{al.title}</span><span style={{ fontSize: 12, color: "var(--pl-text-faint)" }}>{al.cat} · {al.time}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "geral" && <WeatherCard lat={-16.6869} lon={-49.2648} />}

      {/* TÉCNICA */}
      {view === "tecnica" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="pl-card pl-card--solid" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
              <span className="pl-kpi__icon" style={{ width: 38, height: 38, background: "rgba(56,189,248,.15)", color: "var(--pl-info)" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 14, fontWeight: 600 }}>Dados &amp; relatórios</span><span style={{ fontSize: 12, color: "var(--pl-text-muted)" }}>Importar planilhas · exportar · Power BI</span></div>
            </div>
            <button className="pl-btn pl-btn--secondary pl-btn--sm" onClick={() => setPanel("data")} style={{ gap: 7 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M8 8l4-4 4 4" /><path d="M5 20h14" /></svg>Importar</button>
            <button className="pl-btn pl-btn--secondary pl-btn--sm" onClick={() => exportReport("csv")} style={{ gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#16a34a" }} /> Excel/CSV</button>
            <button className="pl-btn pl-btn--secondary pl-btn--sm" onClick={() => exportReport("csv")} style={{ gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--pl-info)" }} /> CSV</button>
            <button className="pl-btn pl-btn--secondary pl-btn--sm" onClick={() => exportReport("pdf")} style={{ gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444" }} /> PDF</button>
            <button className="pl-btn pl-btn--primary pl-btn--sm" onClick={() => setPanel("data")} style={{ gap: 7 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></svg>Power BI</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--pl-text-muted)", padding: "2px 2px 0" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M11 8v6M8 11h6M20 20l-3.2-3.2" /></svg>
            <span>Use o <strong>scroll</strong> para aproximar/afastar · <strong>clique e arraste</strong> para mover no tempo · <strong>duplo-clique</strong> para resetar.</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 18 }}>
            {[
              { t: "Temperatura", s: "°C · scroll/arraste", k: "temp" },
              { t: "Umidade", s: "% · solo e ar", k: "hum" },
              { t: "CO₂", s: "ppm · faixa 200–2.000", k: "co2" },
              { t: "pH do solo", s: "faixa ideal 5,5–7,5", k: "ph" },
            ].map((ch) => (
              <div key={ch.k} className="pl-card pl-card--solid" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><span className="pl-font-display" style={{ fontSize: 16, fontWeight: 600 }}>{ch.t}</span><span style={{ fontSize: 12, color: "var(--pl-text-muted)" }}>{ch.s}</span></div>
                <EChart option={opts[ch.k] ?? {}} height={250} resetZoom />
              </div>
            ))}
          </div>

          <div className="pl-stack2" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18 }}>
            <div className="pl-card pl-card--solid" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><span className="pl-font-display" style={{ fontSize: 16, fontWeight: 600 }}>Comparação de sensores</span><span style={{ fontSize: 12, color: "var(--pl-text-muted)" }}>% do ideal</span></div>
              <EChart option={opts.radar ?? {}} height={280} />
            </div>
            <div className="pl-card pl-card--solid" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="pl-font-display" style={{ fontSize: 16, fontWeight: 600 }}>Comparação entre períodos</span>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--pl-text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#22c55e" }} />Hoje</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#14b8a6" }} />Ontem</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#38bdf8" }} />Semana</span>
                </div>
              </div>
              <EChart option={opts.compare ?? {}} height={280} />
            </div>
          </div>

          <div className="pl-card pl-card--solid" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><span className="pl-font-display" style={{ fontSize: 16, fontWeight: 600 }}>Mapa de calor — leituras por hora</span><span style={{ fontSize: 12, color: "var(--pl-text-muted)" }}>verde = ideal · vermelho = fora da faixa</span></div>
            <EChart option={opts.heat ?? {}} height={300} />
          </div>

          <div className="pl-card pl-card--solid" style={{ display: "flex", flexDirection: "column", gap: 4, overflowX: "auto" }}>
            <span className="pl-font-display" style={{ fontSize: 16, fontWeight: 600, paddingBottom: 8 }}>Estatísticas por sensor — {period}</span>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4,1fr) 1.2fr", gap: 0, minWidth: 560, fontSize: 12, color: "var(--pl-text-faint)", textTransform: "uppercase", letterSpacing: ".04em", padding: "8px 0", borderBottom: "1px solid var(--pl-border-subtle)" }}>
              <span>Sensor</span><span style={{ textAlign: "right" }}>Mín</span><span style={{ textAlign: "right" }}>Máx</span><span style={{ textAlign: "right" }}>Média</span><span style={{ textAlign: "right" }}>Desvio</span><span style={{ textAlign: "right" }}>Estado</span>
            </div>
            {stats.map((st, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4,1fr) 1.2fr", gap: 0, minWidth: 560, alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--pl-border-subtle)", fontSize: 14 }}>
                <span style={{ fontWeight: 500 }}>{st.name}</span>
                <span style={{ textAlign: "right", color: "var(--pl-text-muted)" }}>{st.min}</span>
                <span style={{ textAlign: "right", color: "var(--pl-text-muted)" }}>{st.max}</span>
                <span style={{ textAlign: "right", fontWeight: 600 }}>{st.avg}</span>
                <span style={{ textAlign: "right", color: "var(--pl-text-faint)" }}>{st.std}</span>
                <span style={{ textAlign: "right" }}><span className={"pl-chip " + st.chip}>{st.state}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12, color: "var(--pl-text-faint)", textAlign: "center" }}>Dados ao vivo via API REST (WebSocket planejado) · fluxo ESP32 → borda (Rust) → API → banco → dashboard · importação Excel/CSV/PDF e Power BI processados em módulos Python.</p>
    </section>
  );
}
