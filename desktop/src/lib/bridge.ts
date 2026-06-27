// Ponte de comunicação: dentro do Tauri usa invoke/listen nativos;
// no navegador (npm run dev sem o core Rust) cai num backend simulado em TS,
// permitindo desenvolver e demonstrar a UI sem compilar o binário.

import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { listen as tauriListen } from "@tauri-apps/api/event";
import * as sim from "./browserSim";
import type {
  ConnStatus,
  DepItem,
  PlantProfile,
  ReadingEvent,
  SensorReading,
} from "./types";

export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

type Listener = (payload: unknown) => void;

// ---------- Backend de navegador (fallback demo) ----------

class BrowserBackend {
  private listeners = new Map<string, Set<Listener>>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private last: SensorReading | null = null;
  private history: ReadingEvent[] = [];
  private profile: PlantProfile = {
    name: "Planta",
    ideal_moisture_min: 35,
    ideal_moisture_max: 65,
  };
  private profiles = [
    { id: 1, name: "Planta", ideal_moisture_min: 35, ideal_moisture_max: 65, is_active: true }
  ];
  private settings = new Map<string, string>([
    ["notifications_enabled", "true"],
    ["auto_irrigate", "false"],
    ["auto_cooldown_mins", "30"]
  ]);
  private irrigationLogs: Array<{ id: number; ts: number; duration_s: number; trigger_type: string }> = [];

  emit(event: string, payload: unknown) {
    this.listeners.get(event)?.forEach((cb) => cb(payload));
  }

  listen(event: string, cb: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  async invoke(cmd: string, args?: Record<string, unknown>): Promise<unknown> {
    switch (cmd) {
      case "start_simulator": {
        this.stop();
        const interval = Math.max(200, (args?.intervalMs as number) ?? 2000);
        this.timer = setInterval(() => {
          const reading = sim.nextReading(this.last);
          this.last = reading;
          const event = sim.processReading(reading, this.profile);
          this.history.push(event);
          if (this.history.length > 5000) this.history.shift();
          this.emit("sensor:reading", event);
          if (event.alert) this.emit("sensor:alert", event.alert);
        }, interval);
        this.emit("conn:status", {
          state: "connected",
          port: "simulador (browser)",
          detail: `modo demo, ${interval}ms`,
        } satisfies ConnStatus);
        return null;
      }
      case "stop_source":
        this.stop();
        this.emit("conn:status", {
          state: "disconnected",
          port: "",
          detail: "fonte parada",
        } satisfies ConnStatus);
        return null;
      case "list_serial_ports":
        return []; // serial real só existe no app desktop
      case "connect_serial":
        throw new Error("Conexão serial disponível apenas no aplicativo desktop.");
      case "get_history":
        return this.history
          .slice()
          .reverse()
          .slice(0, (args?.limit as number) ?? 500)
          .map((e) => e.reading);
      case "irrigation_decision": {
        const m = this.last?.soil_moisture;
        if (m == null) throw new Error("Sem leitura de umidade do solo disponível");
        return sim.ruleBasedDecision(
          m,
          this.profile.ideal_moisture_min,
          this.profile.ideal_moisture_max,
        );
      }
      case "get_profile":
        return this.profile;
      case "set_profile": {
        const name = args?.name as string;
        const idealMin = args?.idealMin as number;
        const idealMax = args?.idealMax as number;
        this.profile = {
          name,
          ideal_moisture_min: idealMin,
          ideal_moisture_max: idealMax,
        };
        const active = this.profiles.find((p) => p.is_active);
        if (active) {
          active.name = name;
          active.ideal_moisture_min = idealMin;
          active.ideal_moisture_max = idealMax;
        }
        return null;
      }
      case "list_profiles":
        return this.profiles;
      case "add_profile": {
        const newId = this.profiles.length > 0 ? Math.max(...this.profiles.map((p) => p.id)) + 1 : 1;
        this.profiles.push({
          id: newId,
          name: args?.name as string,
          ideal_moisture_min: args?.idealMin as number,
          ideal_moisture_max: args?.idealMax as number,
          is_active: false,
        });
        return newId;
      }
      case "delete_profile": {
        const id = args?.id as number;
        this.profiles = this.profiles.filter((p) => p.id !== id);
        return null;
      }
      case "activate_profile": {
        const id = args?.id as number;
        this.profiles.forEach((p) => (p.is_active = p.id === id));
        const active = this.profiles.find((p) => p.is_active);
        if (active) {
          this.profile = {
            name: active.name,
            ideal_moisture_min: active.ideal_moisture_min,
            ideal_moisture_max: active.ideal_moisture_max,
          };
        }
        return null;
      }
      case "trigger_irrigation": {
        const duration = (args?.durationS as number) || 30;
        this.irrigationLogs.unshift({
          id: Math.floor(Math.random() * 10000),
          ts: Date.now(),
          duration_s: duration,
          trigger_type: "manual",
        });
        return null;
      }
      case "export_history_csv": {
        const headers = "ts,soil_moisture,air_temperature,air_humidity,light_level,soil_temperature,co2_level,ph_level,source\n";
        const rows = this.history
          .map((e) => {
            const r = e.reading;
            return `${r.ts},${r.soil_moisture},${r.air_temperature},${r.air_humidity},${r.light_level},${r.soil_temperature},${r.co2_level},${r.ph_level},${r.source}`;
          })
          .join("\n");
        const blob = new Blob([headers + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "historico_plantium_simulado.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return "historico_plantium_simulado.csv";
      }
      case "get_system_health":
        return {
          db_size_mb: 1.2,
          reading_count: this.history.length,
          last_ts: this.last?.ts ?? null,
          drivers_ok: true,
        };
      case "save_setting":
        this.settings.set(args?.key as string, args?.value as string);
        return null;
      case "load_setting":
        return this.settings.get(args?.key as string) ?? null;
      case "get_irrigation_logs":
        return this.irrigationLogs.slice(0, (args?.limit as number) ?? 50);
      case "deps_manifest": {
        const os = args?.os as string;
        const all: DepItem[] = [
          {
            id: "cp210x",
            os: "windows",
            label: "Driver CP210x (Silicon Labs) — placas DevKit",
            url: "https://www.silabs.com/documents/public/software/CP210x_Universal_Windows_Driver.zip",
            sha256: "",
            vendor_page:
              "https://www.silabs.com/developer-tools/usb-to-uart-bridge-vcp-drivers",
          },
          {
            id: "ch340",
            os: "windows",
            label: "Driver CH340/CH341 (WCH) — Wemos D1, clones",
            url: null,
            sha256: "",
            vendor_page: "https://www.wch-ic.com/downloads/CH341SER_EXE.html",
          },
          {
            id: "udev-rules",
            os: "linux",
            label: "Permissões seriais (regra udev + grupo dialout)",
            url: null,
            sha256: "",
            vendor_page: "",
          },
        ];
        return all.filter((d) => d.os === os);
      }
      case "install_dependency":
        throw new Error(
          "Instalação de dependências disponível apenas no aplicativo desktop.",
        );
      default:
        throw new Error(`Comando desconhecido no modo browser: ${cmd}`);
    }
  }

  private stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

const browserBackend = new BrowserBackend();

// ---------- API unificada ----------

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) return tauriInvoke<T>(cmd, args);
  return browserBackend.invoke(cmd, args) as Promise<T>;
}

/** Retorna função de unsubscribe. */
export async function listen<T>(event: string, cb: (payload: T) => void): Promise<() => void> {
  if (isTauri) {
    const un = await tauriListen<T>(event, (e) => cb(e.payload));
    return un;
  }
  return browserBackend.listen(event, cb as Listener);
}
