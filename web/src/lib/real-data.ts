import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  alerts,
  devices,
  locations,
  readings,
  sensors,
} from "@/db/schema";

/**
 * Camada de leitura dos dados REAIS do dashboard (escopo sempre por company).
 * O modo real é ativado quando a empresa tem ao menos um dispositivo
 * registrado; sem isso as páginas caem no modo demonstração rotulado.
 */

export const ONLINE_WINDOW_MS = 2 * 60_000;

export interface RealSummary {
  hasDevices: boolean;
  deviceCount: number;
  onlineCount: number;
  locationCount: number;
  sensorCount: number;
}

/**
 * Versão tolerante: retorna null se as tabelas IoT ainda não existirem no
 * banco (migração 0001 pendente) — as páginas caem no modo demonstração em
 * vez de quebrar em produção.
 */
export async function safeRealSummary(
  companyId: string,
): Promise<RealSummary | null> {
  try {
    return await getRealSummary(companyId);
  } catch (err) {
    console.error("real-data: migração 0001 pendente?", err);
    return null;
  }
}

export async function getRealSummary(companyId: string): Promise<RealSummary> {
  const [devs, locs, sens] = await Promise.all([
    db
      .select({ id: devices.id, lastSeenAt: devices.lastSeenAt })
      .from(devices)
      .where(eq(devices.companyId, companyId)),
    db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.companyId, companyId)),
    db
      .select({ id: sensors.id })
      .from(sensors)
      .where(eq(sensors.companyId, companyId)),
  ]);
  const now = Date.now();
  return {
    hasDevices: devs.length > 0,
    deviceCount: devs.length,
    onlineCount: devs.filter(
      (d) => d.lastSeenAt && now - d.lastSeenAt.getTime() < ONLINE_WINDOW_MS,
    ).length,
    locationCount: locs.length,
    sensorCount: sens.length,
  };
}

/** Ponto de série temporal enviado ao client (serializável). */
export interface SeriesPoint {
  ts: string; // ISO
  soilMoisture: number | null;
  airTemperature: number | null;
  airHumidity: number | null;
  lightLevel: number | null;
  soilTemperature: number | null;
  co2Level: number | null;
  phLevel: number | null;
}

export interface LatestMetrics {
  ts: string | null;
  soilMoisture: number | null;
  airTemperature: number | null;
  airHumidity: number | null;
  lightLevel: number | null;
  soilTemperature: number | null;
  co2Level: number | null;
  phLevel: number | null;
}

const METRIC_KEYS = [
  "soilMoisture",
  "airTemperature",
  "airHumidity",
  "lightLevel",
  "soilTemperature",
  "co2Level",
  "phLevel",
] as const;

async function companySensorIds(companyId: string): Promise<string[]> {
  const rows = await db
    .select({ id: sensors.id })
    .from(sensors)
    .where(eq(sensors.companyId, companyId));
  return rows.map((r) => r.id);
}

/**
 * Série das últimas `hours` horas (ordem cronológica, até 1000 pontos)
 * agregando todos os sensores da empresa.
 */
export async function getSeries(
  companyId: string,
  hours = 24,
): Promise<SeriesPoint[]> {
  const ids = await companySensorIds(companyId);
  if (ids.length === 0) return [];
  const since = new Date(Date.now() - hours * 3_600_000);
  const rows = await db
    .select()
    .from(readings)
    .where(and(inArray(readings.sensorId, ids), gte(readings.ts, since)))
    .orderBy(desc(readings.ts))
    .limit(1000);

  return rows.reverse().map((r) => ({
    ts: r.ts.toISOString(),
    soilMoisture: r.soilMoisture,
    airTemperature: r.airTemperature,
    airHumidity: r.airHumidity,
    lightLevel: r.lightLevel,
    soilTemperature: r.soilTemperature,
    co2Level: r.co2Level,
    phLevel: r.phLevel,
  }));
}

/**
 * Última leitura conhecida por métrica (combina leituras recentes: sensores
 * diferentes reportam métricas diferentes).
 */
export async function getLatestMetrics(
  companyId: string,
): Promise<LatestMetrics> {
  const ids = await companySensorIds(companyId);
  const empty: LatestMetrics = {
    ts: null,
    soilMoisture: null,
    airTemperature: null,
    airHumidity: null,
    lightLevel: null,
    soilTemperature: null,
    co2Level: null,
    phLevel: null,
  };
  if (ids.length === 0) return empty;

  const rows = await db
    .select()
    .from(readings)
    .where(inArray(readings.sensorId, ids))
    .orderBy(desc(readings.ts))
    .limit(100);

  const out = { ...empty };
  for (const r of rows) {
    if (!out.ts) out.ts = r.ts.toISOString();
    for (const k of METRIC_KEYS) {
      if (out[k] === null && r[k] !== null) out[k] = r[k];
    }
  }
  return out;
}

export interface OpenAlert {
  id: string;
  severity: "info" | "atencao" | "critico";
  metric: string | null;
  value: number | null;
  message: string;
  createdAt: string;
}

export async function getOpenAlerts(companyId: string): Promise<OpenAlert[]> {
  const rows = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.companyId, companyId), eq(alerts.resolved, false)))
    .orderBy(desc(alerts.createdAt))
    .limit(100);
  return rows.map((a) => ({
    id: a.id,
    severity: a.severity,
    metric: a.metric,
    value: a.value,
    message: a.message,
    createdAt: a.createdAt.toISOString(),
  }));
}
