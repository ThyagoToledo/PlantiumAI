import Link from "next/link";
import { auth } from "@/auth";
import { DemoDashboard } from "@/components/app/demo-dashboard";
import { RealOverview } from "@/components/app/real-overview";
import {
  getLatestMetrics,
  getOpenAlerts,
  getSeries,
  safeRealSummary,
} from "@/lib/real-data";

// Dados vêm do banco a cada request (telemetria muda o tempo todo).
export const dynamic = "force-dynamic";

/**
 * Visão geral: com dispositivo registrado → dados reais; sem dispositivo →
 * modo demonstração claramente rotulado (nunca fingimos dado real).
 */
export default async function DashboardPage() {
  const session = await auth();
  const companyId = session?.user?.companyId ?? null;
  const name = session?.user?.name?.split(" ")[0] ?? "Produtor";

  if (companyId) {
    const summary = await safeRealSummary(companyId);
    if (summary?.hasDevices) {
      const [latest, series, alerts] = await Promise.all([
        getLatestMetrics(companyId),
        getSeries(companyId, 24),
        getOpenAlerts(companyId),
      ]);
      return (
        <RealOverview
          name={name}
          summary={summary}
          latest={latest}
          series={series}
          alerts={alerts}
        />
      );
    }
  }

  return (
    <>
      <div
        className="pl-card pl-card--solid"
        style={{
          padding: "12px 18px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "var(--pl-text-muted)",
        }}
      >
        <span className="pl-chip pl-chip--atencao">
          <span className="pl-chip__dot" />
          Modo demonstração
        </span>
        <span style={{ flex: 1, minWidth: 220 }}>
          Os dados abaixo são simulados.{" "}
          <Link href="/app/dispositivos" style={{ color: "var(--pl-brand-green)", fontWeight: 600 }}>
            Registre um dispositivo
          </Link>{" "}
          para ver as leituras reais da sua estufa.
        </span>
      </div>
      <DemoDashboard />
    </>
  );
}
