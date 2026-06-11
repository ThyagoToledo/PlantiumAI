// Simulador em TypeScript — espelho do sim.rs/domain.rs do núcleo Rust.
// Usado SOMENTE quando o app roda fora do Tauri (demo no navegador),
// para que o dashboard funcione sem o binário nativo.

import type {
  Alert,
  IrrigationDecision,
  PlantProfile,
  ReadingEvent,
  SensorReading,
} from "./types";

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function nextReading(last: SensorReading | null): SensorReading {
  const hour = new Date().getHours();

  const baseMoisture = last?.soil_moisture != null ? last.soil_moisture - rnd(0.5, 2.0) : rnd(40, 70);
  const baseTemp = last?.air_temperature != null ? last.air_temperature + rnd(-0.5, 0.5) : rnd(20, 32);
  const baseHumidity = last?.air_humidity != null ? last.air_humidity + rnd(-2, 2) : rnd(45, 75);

  let tempModifier = 0;
  if (hour >= 10 && hour <= 16) tempModifier = rnd(2, 6);
  else if (hour >= 20 || hour <= 5) tempModifier = rnd(-3, -1);

  const light = hour >= 6 && hour <= 18 ? rnd(5000, 80000) : rnd(0, 10);

  return {
    soil_moisture: clamp(baseMoisture, 5, 95),
    air_temperature: clamp(baseTemp + tempModifier, 10, 45),
    air_humidity: clamp(baseHumidity, 20, 95),
    light_level: light,
    soil_temperature: clamp(baseTemp + tempModifier - 3, 10, 40),
    co2_level: rnd(350, 600),
    ph_level: rnd(5.5, 7.5),
    source: "simulated (browser)",
    ts: Date.now(),
  };
}

export function classifyMoisture(m: number): string {
  if (m < 20) return "dry";
  if (m < 35) return "low";
  if (m <= 65) return "optimal";
  if (m <= 80) return "high";
  return "saturated";
}

export function moistureAlert(
  moisture: number,
  plantName: string,
  idealMin: number,
  idealMax: number,
  ts: number,
): Alert | null {
  if (moisture < idealMin * 0.5) {
    return {
      severity: "critical",
      category: "irrigation",
      title: `Solo criticamente seco — ${plantName}`,
      message: `Umidade do solo em ${moisture.toFixed(0)}% (mínimo ideal: ${idealMin.toFixed(0)}%). Irrigação urgente necessária!`,
      ts,
    };
  }
  if (moisture < idealMin) {
    return {
      severity: "warning",
      category: "irrigation",
      title: `Solo seco — ${plantName}`,
      message: `Umidade do solo em ${moisture.toFixed(0)}% (abaixo do mínimo de ${idealMin.toFixed(0)}%). Considere irrigar.`,
      ts,
    };
  }
  if (moisture > idealMax * 1.2) {
    return {
      severity: "warning",
      category: "irrigation",
      title: `Solo encharcado — ${plantName}`,
      message: `Umidade do solo em ${moisture.toFixed(0)}% (acima do máximo de ${idealMax.toFixed(0)}%). Verifique a drenagem.`,
      ts,
    };
  }
  return null;
}

export function processReading(reading: SensorReading, profile: PlantProfile): ReadingEvent {
  const m = reading.soil_moisture;
  return {
    reading,
    valid: true,
    warnings: [],
    moisture_class: m != null ? classifyMoisture(m) : null,
    alert:
      m != null
        ? moistureAlert(m, profile.name, profile.ideal_moisture_min, profile.ideal_moisture_max, reading.ts)
        : null,
  };
}

export function ruleBasedDecision(
  soilMoisture: number,
  idealMin: number,
  idealMax: number,
): IrrigationDecision {
  if (soilMoisture < idealMin * 0.6) {
    return {
      should_irrigate: true,
      urgency: "critical",
      duration_minutes: 25,
      reasoning: `Solo criticamente seco (${soilMoisture.toFixed(0)}%)`,
      warnings: [],
      provider: "regra_local (browser)",
    };
  }
  if (soilMoisture < idealMin) {
    return {
      should_irrigate: true,
      urgency: "medium",
      duration_minutes: 15,
      reasoning: `Solo abaixo do ideal (${soilMoisture.toFixed(0)}% < ${idealMin.toFixed(0)}%)`,
      warnings: [],
      provider: "regra_local (browser)",
    };
  }
  if (soilMoisture > idealMax) {
    return {
      should_irrigate: false,
      urgency: "none",
      duration_minutes: 0,
      reasoning: `Solo úmido o suficiente (${soilMoisture.toFixed(0)}%)`,
      warnings: ["Solo acima do ideal, monitorar drenagem"],
      provider: "regra_local (browser)",
    };
  }
  return {
    should_irrigate: false,
    urgency: "none",
    duration_minutes: 0,
    reasoning: `Solo em nível ideal (${soilMoisture.toFixed(0)}%)`,
    warnings: [],
    provider: "regra_local (browser)",
  };
}
