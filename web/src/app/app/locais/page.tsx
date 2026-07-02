import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { alerts, devices, locations, sensors } from "@/db/schema";
import { DemoLocais } from "@/components/app/demo-locais";
import { LocationForm } from "@/components/location-form";
import { ONLINE_WINDOW_MS } from "@/lib/real-data";
import { createLocation, deleteLocation } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  estufa: "Estufa",
  plantacao_vertical: "Plantação vertical",
  container: "Container",
};

/**
 * Locais: quando a empresa já registrou locais reais, lista do banco com
 * status derivado dos dispositivos; sem cadastro → demonstração rotulada.
 */
export default async function LocaisPage() {
  const session = await auth();
  const companyId = session?.user?.companyId ?? null;
  const isEmpresa = session?.user?.role === "empresa";

  const locs = companyId
    ? await db
        .select()
        .from(locations)
        .where(eq(locations.companyId, companyId))
        .orderBy(desc(locations.createdAt))
    : [];

  if (!companyId || locs.length === 0) {
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {isEmpresa && companyId && (
          <div className="rounded-2xl glass p-5">
            <h2 className="font-display text-lg font-600">Adicionar primeiro local</h2>
            <p className="mt-1 text-sm text-muted">
              Cadastre a estufa real para sair do modo demonstração.
            </p>
            <div className="mt-4">
              <LocationForm action={createLocation} />
            </div>
          </div>
        )}
        <div className="pl-card pl-card--solid" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--pl-text-muted)" }}>
          <span className="pl-chip pl-chip--atencao"><span className="pl-chip__dot" />Modo demonstração</span>
          <span>Os locais abaixo são simulados.</span>
        </div>
        <DemoLocais />
      </section>
    );
  }

  const sens = await db
    .select({ id: sensors.id, locationId: sensors.locationId })
    .from(sensors)
    .where(eq(sensors.companyId, companyId));

  // Tabelas IoT podem não existir ainda (migração 0001 pendente).
  let devs: Array<{ id: string; locationId: string | null; lastSeenAt: Date | null }> = [];
  let openAlerts: Array<{ id: string; locationId: string | null }> = [];
  try {
    [devs, openAlerts] = await Promise.all([
      db
        .select({ id: devices.id, locationId: devices.locationId, lastSeenAt: devices.lastSeenAt })
        .from(devices)
        .where(eq(devices.companyId, companyId)),
      db
        .select({ id: alerts.id, locationId: alerts.locationId })
        .from(alerts)
        .where(eq(alerts.companyId, companyId)),
    ]);
  } catch (err) {
    console.error("locais: migração 0001 pendente?", err);
  }

  const now = Date.now();
  const view = locs.map((lo) => {
    const locDevices = devs.filter((d) => d.locationId === lo.id);
    const online = locDevices.some(
      (d) => d.lastSeenAt && now - d.lastSeenAt.getTime() < ONLINE_WINDOW_MS,
    );
    const status = locDevices.length === 0
      ? { chip: "pl-chip--atencao", label: "Sem dispositivo" }
      : online
        ? { chip: "pl-chip--ideal", label: "Online" }
        : { chip: "pl-chip--critico", label: "Offline" };
    return {
      ...lo,
      typeLabel: TYPE_LABEL[lo.type] ?? lo.type,
      deviceCount: locDevices.length,
      sensorCount: sens.filter((s) => s.locationId === lo.id).length,
      alertCount: openAlerts.filter((a) => a.locationId === lo.id).length,
      status,
    };
  });

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 className="pl-font-display pl-page-title" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-.01em" }}>Locais monitorados</h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--pl-text-muted)" }}>
            {view.length} locais · {view.filter((l) => l.status.label === "Online").length} online · {view.filter((l) => l.alertCount > 0).length} com alertas
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(258px,1fr))", gap: 16 }}>
        {view.map((lo) => (
          <div key={lo.id} className="pl-card pl-card--solid pl-sensor" style={{ display: "flex", flexDirection: "column", gap: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <span className="pl-kpi__icon" style={{ width: 44, height: 44 }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 11l8-6 8 6v9H4z" /><path d="M9 20v-5h6v5" /></svg>
              </span>
              <span className={"pl-chip " + lo.status.chip}><span className="pl-chip__dot" />{lo.status.label}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span className="pl-font-display" style={{ fontSize: 17, fontWeight: 600 }}>{lo.name}</span>
              <span style={{ fontSize: 13, color: "var(--pl-text-muted)" }}>
                {lo.typeLabel}
                {lo.description ? ` · ${lo.description}` : ""}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: "var(--pl-text-muted)" }}>
              <span className="pl-chip">{lo.deviceCount} device(s)</span>
              <span className="pl-chip">{lo.sensorCount} sensor(es)</span>
              <span className={"pl-chip " + (lo.alertCount > 0 ? "pl-chip--atencao" : "pl-chip--ideal")}>
                {lo.alertCount > 0 ? `${lo.alertCount} alerta(s)` : "Sem alertas"}
              </span>
            </div>
            {isEmpresa && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--pl-border-subtle)", paddingTop: 13 }}>
                <Link href={`/app/locais/${lo.id}`} className="pl-btn pl-btn--secondary pl-btn--sm">Editar</Link>
                <form action={deleteLocation}>
                  <input type="hidden" name="id" value={lo.id} />
                  <button className="pl-btn pl-btn--sm" style={{ color: "var(--pl-danger)" }}>Remover</button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>

      {isEmpresa && (
        <div className="rounded-2xl glass p-5">
          <h2 className="font-display text-lg font-600">Adicionar local</h2>
          <div className="mt-4">
            <LocationForm action={createLocation} />
          </div>
        </div>
      )}
    </section>
  );
}
