import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, HardDriveDownload, MonitorCog } from "lucide-react";
import { invoke, listen, isTauri } from "../lib/bridge";
import type { DepItem, DepProgress } from "../lib/types";

type OsChoice = "windows" | "linux";

function detectOs(): OsChoice {
  return navigator.userAgent.toLowerCase().includes("linux") ? "linux" : "windows";
}

export default function DependenciesPage() {
  const [os, setOs] = useState<OsChoice>(detectOs());
  const [items, setItems] = useState<DepItem[]>([]);
  const [progress, setProgress] = useState<Record<string, DepProgress>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadManifest = useCallback(async (choice: OsChoice) => {
    setItems(await invoke<DepItem[]>("deps_manifest", { os: choice }));
  }, []);

  useEffect(() => {
    loadManifest(os);
  }, [os, loadManifest]);

  useEffect(() => {
    let un: (() => void) | undefined;
    (async () => {
      un = await listen<DepProgress>("deps:progress", (p) => {
        setProgress((prev) => ({ ...prev, [p.id]: p }));
      });
    })();
    return () => un?.();
  }, []);

  async function install(item: DepItem) {
    setErrors((prev) => ({ ...prev, [item.id]: "" }));
    setProgress((prev) => ({
      ...prev,
      [item.id]: { id: item.id, stage: "downloading", detail: "", percent: 0 },
    }));
    try {
      await invoke("install_dependency", { id: item.id, os });
    } catch (e) {
      setErrors((prev) => ({ ...prev, [item.id]: String(e) }));
      setProgress((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  }

  const STAGE_LABEL: Record<DepProgress["stage"], string> = {
    downloading: "Baixando…",
    verifying: "Verificando integridade (SHA256)…",
    installing: "Instalando…",
    done: "Concluído",
    error: "Erro",
    manual: "Página oficial aberta no navegador",
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="card space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <MonitorCog size={16} /> Sistema operacional de destino
        </h3>
        <div className="flex gap-2">
          {(["windows", "linux"] as const).map((choice) => (
            <button
              key={choice}
              onClick={() => setOs(choice)}
              className={`btn ${
                os === choice
                  ? "bg-leaf-600 text-white"
                  : "border border-surface-border hover:bg-surface-overlay"
              }`}
            >
              {choice === "windows" ? "Windows" : "Linux"}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {os === "windows"
            ? "No Windows, a comunicação com a ESP32 exige o driver do chip USB-UART da placa (CH340 ou CP210x)."
            : "No Linux, o kernel já inclui os drivers (ch341/cp210x) — só é preciso conceder permissão de acesso à porta serial."}
        </p>
      </div>

      {!isTauri && (
        <p className="rounded-lg border border-amber-900 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
          Modo demo (navegador): a instalação real de dependências só funciona no
          aplicativo desktop.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const p = progress[item.id];
          const err = errors[item.id];
          return (
            <div key={item.id} className="card space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">
                    {item.url ? "Download direto + verificação SHA256" : item.os === "linux" ? "Configuração local (pkexec)" : "Via página oficial do fabricante"}
                  </p>
                </div>
                <button
                  className="btn-primary shrink-0"
                  onClick={() => install(item)}
                  disabled={p && p.stage !== "done" && p.stage !== "manual" && !err}
                >
                  {item.url || item.os === "linux" ? (
                    <HardDriveDownload size={16} />
                  ) : (
                    <ExternalLink size={16} />
                  )}
                  Baixar dependências
                </button>
              </div>

              {p && (
                <div className="space-y-1">
                  <p
                    className={`text-xs ${
                      p.stage === "done"
                        ? "text-leaf-400"
                        : p.stage === "error"
                          ? "text-red-400"
                          : "text-gray-400"
                    }`}
                  >
                    {STAGE_LABEL[p.stage]} {p.detail && <span className="opacity-60">— {p.detail}</span>}
                  </p>
                  {p.percent != null && p.stage === "downloading" && (
                    <div className="h-1.5 w-full overflow-hidden rounded bg-surface-overlay">
                      <div
                        className="h-full bg-leaf-500 transition-all"
                        style={{ width: `${p.percent}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
              {err && <p className="text-xs text-red-400">{err}</p>}
            </div>
          );
        })}
      </div>

      <div className="card text-xs leading-relaxed text-gray-500">
        <p className="mb-1 flex items-center gap-1 font-medium text-gray-400">
          <Download size={14} /> Como funciona
        </p>
        <ol className="list-inside list-decimal space-y-1">
          <li>O app identifica o chip da sua placa pelo VID/PID na aba Conexão.</li>
          <li>Windows: baixa o driver do fabricante, valida o SHA256 e abre o instalador.</li>
          <li>Linux: grava a regra udev e adiciona seu usuário ao grupo dialout (pede senha via pkexec).</li>
          <li>Reconecte a ESP32 e volte à aba Conexão para conectar.</li>
        </ol>
      </div>
    </div>
  );
}
