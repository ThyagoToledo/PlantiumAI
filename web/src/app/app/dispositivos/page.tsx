import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  actuators,
  deviceCommands,
  devices,
  deviceTokens,
  locations,
  sensors,
} from "@/db/schema";
import {
  ActuatorForm,
  DeviceForm,
  DeviceTokenGenerator,
} from "@/components/device-forms";
import { deleteActuator, deleteDevice, sendCommand } from "./actions";

// Considera online quem deu sinal de vida nos últimos 2 minutos.
const ONLINE_WINDOW_MS = 2 * 60_000;

const MODEL_LABEL: Record<string, string> = {
  esp32: "ESP32",
  esp32cam: "ESP32-CAM",
  gateway: "Gateway",
};

const ACTUATOR_LABEL: Record<string, string> = {
  pump: "Bomba",
  valve: "Válvula",
  fan: "Ventilação",
  exhaust: "Exaustão",
  led_panel: "Painel LED",
  relay: "Relé",
  heater: "Aquecedor",
};

const COMMAND_STATUS_LABEL: Record<string, string> = {
  pending: "aguardando device",
  sent: "enviado",
  acked: "executado",
  failed: "falhou",
  expired: "expirado",
};

function onlineInfo(lastSeenAt: Date | null) {
  if (!lastSeenAt) return { label: "nunca conectou", cls: "bg-black/10 text-muted" };
  const online = Date.now() - lastSeenAt.getTime() < ONLINE_WINDOW_MS;
  return online
    ? { label: "online", cls: "bg-brand/10 text-brand" }
    : { label: `visto ${lastSeenAt.toLocaleString("pt-BR")}`, cls: "bg-warn/10 text-warn" };
}

export default async function DispositivosPage() {
  const session = await auth();
  if (session!.user.role !== "empresa") redirect("/app");
  const companyId = session!.user.companyId;

  const locs = companyId
    ? await db
        .select({ id: locations.id, name: locations.name })
        .from(locations)
        .where(eq(locations.companyId, companyId))
    : [];

  // Tabela nova — se a migração 0001 ainda não foi aplicada, avisa em vez de quebrar.
  let devs: (typeof devices.$inferSelect)[] = [];
  let migrationPending = false;
  try {
    devs = companyId
      ? await db
          .select()
          .from(devices)
          .where(eq(devices.companyId, companyId))
          .orderBy(desc(devices.createdAt))
      : [];
  } catch (err) {
    console.error("dispositivos: migração 0001 pendente?", err);
    migrationPending = true;
  }

  if (migrationPending) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="font-display text-2xl font-700">Dispositivos</h1>
        </header>
        <section className="rounded-2xl glass p-8 text-center text-muted">
          O banco ainda não tem as tabelas de dispositivos. Aplique a migração{" "}
          <code>web/drizzle/0001_iot_devices.sql</code> no Neon (SQL Editor) e
          recarregue esta página.
        </section>
      </div>
    );
  }

  const deviceIds = devs.map((d) => d.id);
  const [acts, tokens, sens, lastCommands] =
    deviceIds.length > 0
      ? await Promise.all([
          db
            .select()
            .from(actuators)
            .where(inArray(actuators.deviceId, deviceIds)),
          db
            .select({
              id: deviceTokens.id,
              deviceId: deviceTokens.deviceId,
              prefix: deviceTokens.prefix,
              revoked: deviceTokens.revoked,
            })
            .from(deviceTokens)
            .where(
              and(
                inArray(deviceTokens.deviceId, deviceIds),
                eq(deviceTokens.revoked, false),
              ),
            ),
          db
            .select({
              id: sensors.id,
              deviceId: sensors.deviceId,
              deviceTokenId: sensors.deviceTokenId,
            })
            .from(sensors)
            .where(eq(sensors.companyId, companyId!)),
          db
            .select()
            .from(deviceCommands)
            .where(inArray(deviceCommands.deviceId, deviceIds))
            .orderBy(desc(deviceCommands.createdAt))
            .limit(50),
        ])
      : [[], [], [], []];

  const locName = new Map(locs.map((l) => [l.id, l.name]));
  const lastCmdByActuator = new Map<string, (typeof lastCommands)[number]>();
  for (const c of lastCommands) {
    if (c.actuatorId && !lastCmdByActuator.has(c.actuatorId)) {
      lastCmdByActuator.set(c.actuatorId, c);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-700">Dispositivos</h1>
        <p className="text-sm text-muted">
          ESP32 e gateways conectados às suas estufas — telemetria, token do
          firmware e controle dos atuadores.
        </p>
      </header>

      <DeviceForm locations={locs} />

      {devs.length === 0 && (
        <section className="rounded-2xl glass p-8 text-center text-muted">
          Nenhum dispositivo ainda. Registre o primeiro acima — depois gere o
          token e grave-o no firmware do ESP32.
        </section>
      )}

      {devs.map((d) => {
        const st = onlineInfo(d.lastSeenAt);
        const token = tokens.find((t) => t.deviceId === d.id);
        const deviceActuators = acts.filter((a) => a.deviceId === d.id);
        // Sensor pertence ao device por vínculo direto ou pelo token ativo.
        const sensorCount = sens.filter(
          (s) => s.deviceId === d.id || (token && s.deviceTokenId === token.id),
        ).length;

        return (
          <section key={d.id} className="rounded-2xl glass p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-600">{d.name}</h2>
                <p className="mt-0.5 text-sm text-muted">
                  {MODEL_LABEL[d.model] ?? d.model}
                  {d.locationId ? ` · ${locName.get(d.locationId) ?? "—"}` : " · sem local"}
                  {` · ${sensorCount} sensor(es)`}
                  {d.firmwareVersion ? ` · fw ${d.firmwareVersion}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-600 ${st.cls}`}>
                  {st.label}
                </span>
                <form action={deleteDevice}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-600 text-danger transition hover:bg-danger/10"
                    title="Remove o device, atuadores e comandos (sensores ficam)"
                  >
                    Remover
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {token ? (
                <code className="rounded-lg bg-black/80 px-3 py-1.5 font-mono text-xs text-leaf-200">
                  plt_{token.prefix}…
                </code>
              ) : (
                <span className="text-xs text-muted">Sem token ativo.</span>
              )}
              <DeviceTokenGenerator deviceId={d.id} hasToken={!!token} />
            </div>

            <div className="mt-5 border-t border-black/5 pt-4 dark:border-white/10">
              <h3 className="text-sm font-600">Atuadores</h3>

              {deviceActuators.length === 0 && (
                <p className="mt-1 text-sm text-muted">
                  Nenhum atuador. Cadastre a bomba, válvula ou painel LED ligado
                  a este device.
                </p>
              )}

              <ul className="mt-2 flex flex-col gap-2">
                {deviceActuators.map((a) => {
                  const cmd = lastCmdByActuator.get(a.id);
                  return (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/5 px-3 py-2.5 dark:border-white/10"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-600">{a.name}</span>
                        <span className="ml-2 text-xs text-muted">
                          {ACTUATOR_LABEL[a.type] ?? a.type} · canal {a.channel}
                        </span>
                        <div className="mt-0.5 text-xs text-muted">
                          Estado:{" "}
                          <strong className={a.isOn ? "text-brand" : ""}>
                            {a.isOn
                              ? a.level != null
                                ? `ligado (${a.level}%)`
                                : "ligado"
                              : "desligado"}
                          </strong>
                          {cmd && cmd.status !== "acked" && (
                            <span className="ml-2 rounded-full bg-warn/10 px-2 py-0.5 text-warn">
                              último comando: {COMMAND_STATUS_LABEL[cmd.status] ?? cmd.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <form action={sendCommand}>
                          <input type="hidden" name="actuatorId" value={a.id} />
                          <input type="hidden" name="command" value="on" />
                          <button className="rounded-lg bg-brand px-3 py-1.5 text-xs font-600 text-white transition hover:bg-brand-deep">
                            Ligar
                          </button>
                        </form>
                        <form action={sendCommand}>
                          <input type="hidden" name="actuatorId" value={a.id} />
                          <input type="hidden" name="command" value="off" />
                          <button className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-600 transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
                            Desligar
                          </button>
                        </form>
                        {a.type === "led_panel" && (
                          <form action={sendCommand} className="flex items-center gap-1.5">
                            <input type="hidden" name="actuatorId" value={a.id} />
                            <input type="hidden" name="command" value="set_level" />
                            <input
                              name="level"
                              type="number"
                              min={0}
                              max={100}
                              defaultValue={a.level ?? 50}
                              className="w-16 rounded-lg border border-black/10 bg-white/60 px-2 py-1.5 text-xs outline-none focus:border-brand dark:border-white/10 dark:bg-black/20"
                              aria-label="Intensidade (%)"
                            />
                            <button className="rounded-lg border border-brand/40 px-3 py-1.5 text-xs font-600 text-brand transition hover:bg-brand/10">
                              Intensidade
                            </button>
                          </form>
                        )}
                        <form action={deleteActuator}>
                          <input type="hidden" name="id" value={a.id} />
                          <button
                            className="rounded-lg px-2 py-1.5 text-xs text-danger transition hover:bg-danger/10"
                            aria-label={`Remover ${a.name}`}
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3">
                <ActuatorForm deviceId={d.id} />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
