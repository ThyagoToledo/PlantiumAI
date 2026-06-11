// Tipos espelhando os structs do núcleo Rust (src-tauri/src)

export interface SensorReading {
  soil_moisture: number | null;
  air_temperature: number | null;
  air_humidity: number | null;
  light_level: number | null;
  soil_temperature: number | null;
  co2_level: number | null;
  ph_level: number | null;
  source: string;
  ts: number;
}

export interface Alert {
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  message: string;
  ts: number;
}

export interface ReadingEvent {
  reading: SensorReading;
  valid: boolean;
  warnings: string[];
  moisture_class: string | null;
  alert: Alert | null;
}

export interface PortInfo {
  name: string;
  chip: string;
  vid: number | null;
  pid: number | null;
  description: string;
}

export interface ConnStatus {
  state: "connected" | "reconnecting" | "disconnected";
  port: string;
  detail: string;
}

export interface DepItem {
  id: string;
  os: "windows" | "linux";
  label: string;
  url: string | null;
  sha256: string;
  vendor_page: string;
}

export interface DepProgress {
  id: string;
  stage: "downloading" | "verifying" | "installing" | "done" | "error" | "manual";
  detail: string;
  percent: number | null;
}

export interface IrrigationDecision {
  should_irrigate: boolean;
  urgency: "critical" | "medium" | "none";
  duration_minutes: number;
  reasoning: string;
  warnings: string[];
  provider: string;
}

export interface PlantProfile {
  name: string;
  ideal_moisture_min: number;
  ideal_moisture_max: number;
}

export interface HistoryRow {
  ts: number;
  soil_moisture: number | null;
  air_temperature: number | null;
  air_humidity: number | null;
  light_level: number | null;
  soil_temperature: number | null;
  co2_level: number | null;
  ph_level: number | null;
  source: string;
}
