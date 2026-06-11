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
      case "set_profile":
        this.profile = {
          name: args?.name as string,
          ideal_moisture_min: args?.idealMin as number,
          ideal_moisture_max: args?.idealMax as number,
        };
        return null;
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
