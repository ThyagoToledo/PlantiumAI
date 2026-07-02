import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { DemoAlertas } from "@/components/app/demo-alertas";
import { safeRealSummary } from "@/lib/real-data";
import { resolveAlertAction } from "./actions";

export const dynamic = "force-dynamic";

const SEV = {
  critico: { label: "Crítico", chip: "pl-chip--critico" },
  atencao: { label: "Atenção", chip: "pl-chip--atencao" },
  info: { label: "Info", chip: "pl-chip--ideal" },
} as const;

/**
 * Alertas: com dispositivo registrado → alertas reais persistidos (gerados
 * na ingestão de telemetria); sem dispositivo → demonstração rotulada.
 */
export default async function AlertasPage() {
  const session = await auth();
  const companyId = session?.user?.companyId ?? null;
  const summary = companyId ? await safeRealSummary(companyId) : null;

  if (!companyId || !summary?.hasDevices) {
    return <DemoAlertas />;
  }

  const rows = await db
    .select()
    .from(alerts)
    .where(eq(alerts.companyId, companyId))
    .orderBy(desc(alerts.createdAt))
    .limit(200);

  const open = rows.filter((a) => !a.resolved);
  const criticos = open.filter((a) => a.severity === "critico").length;
  const atencao = open.filter((a) => a.severity === "atencao").length;
  const resolvidos = rows.filter((a) => a.resolved).length;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="pl-font-display pl-page-title" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-.01em" }}>Alertas</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--pl-text-muted)" }}>
          Alertas reais gerados pela telemetria dos seus dispositivos
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        <div className="pl-card pl-card--solid pl-kpi" style={{ gap: 8 }}>
          <span className="pl-kpi__label">Críticos</span>
          <span className="pl-kpi__value" style={{ fontSize: 32 }}>{criticos}</span>
        </div>
        <div className="pl-card pl-card--solid pl-kpi" style={{ gap: 8 }}>
          <span className="pl-kpi__label">Atenção</span>
          <span className="pl-kpi__value" style={{ fontSize: 32 }}>{atencao}</span>
        </div>
        <div className="pl-card pl-card--solid pl-kpi" style={{ gap: 8 }}>
          <span className="pl-kpi__label">Resolvidos</span>
          <span className="pl-kpi__value" style={{ fontSize: 32 }}>{resolvidos}</span>
        </div>
      </div>

      <div className="pl-card pl-card--solid" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rows.map((a) => {
          const sev = SEV[a.severity] ?? SEV.info;
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 0", borderBottom: "1px solid var(--pl-border-subtle)", flexWrap: "wrap" }}>
              <span className={"pl-chip " + sev.chip} style={{ flexShrink: 0 }}>
                <span className="pl-chip__dot" />{sev.label}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 160 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{a.message}</span>
                <span style={{ fontSize: 12, color: "var(--pl-text-faint)" }}>
                  {a.metric ? `${a.metric}${a.value != null ? ` = ${a.value}` : ""} · ` : ""}
                  {a.createdAt.toLocaleString("pt-BR")}
                </span>
              </div>
              {a.resolved ? (
                <span className="pl-chip pl-chip--ideal" style={{ flexShrink: 0 }}>
                  <span className="pl-chip__dot" />Resolvido
                </span>
              ) : (
                <form action={resolveAlertAction} style={{ flexShrink: 0 }}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="pl-btn pl-btn--secondary pl-btn--sm">Resolver</button>
                </form>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", color: "var(--pl-text-faint)", fontSize: 14 }}>
            Nenhum alerta até agora — as leituras estão dentro das faixas.
          </div>
        )}
      </div>
    </section>
  );
}
