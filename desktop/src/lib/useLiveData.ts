// Hook central de dados ao vivo: assina eventos do núcleo e mantém
// ring buffer de leituras + feed de alertas + status de conexão.
import { useEffect, useRef, useState } from "react";
import { listen } from "./bridge";
import type { Alert, ConnStatus, ReadingEvent } from "./types";

const BUFFER_SIZE = 300;

export function useLiveData() {
  const [events, setEvents] = useState<ReadingEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [conn, setConn] = useState<ConnStatus>({
    state: "disconnected",
    port: "",
    detail: "",
  });
  const buffer = useRef<ReadingEvent[]>([]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    let mounted = true;

    (async () => {
      unsubs.push(
        await listen<ReadingEvent>("sensor:reading", (e) => {
          if (!mounted) return;
          buffer.current = [...buffer.current.slice(-(BUFFER_SIZE - 1)), e];
          setEvents(buffer.current);
        }),
      );
      unsubs.push(
        await listen<Alert>("sensor:alert", (a) => {
          if (!mounted) return;
          setAlerts((prev) => [a, ...prev].slice(0, 50));
        }),
      );
      unsubs.push(
        await listen<ConnStatus>("conn:status", (s) => {
          if (!mounted) return;
          setConn(s);
        }),
      );
    })();

    return () => {
      mounted = false;
      unsubs.forEach((u) => u());
    };
  }, []);

  const latest = events.length > 0 ? events[events.length - 1] : null;
  return { events, latest, alerts, conn };
}
