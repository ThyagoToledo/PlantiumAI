import { useEffect, useState } from "react";
import { Cable, HardDriveDownload, LayoutDashboard, Leaf, Settings, History, Activity } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import ConnectionPage from "./pages/ConnectionPage";
import DependenciesPage from "./pages/DependenciesPage";
import SettingsPage from "./pages/SettingsPage";
import HistoryPage from "./pages/HistoryPage";
import StatusPage from "./pages/StatusPage";
import { useLiveData } from "./lib/useLiveData";
import { isTauri, invoke } from "./lib/bridge";
import type { PlantProfile, PlantProfileRow } from "./lib/types";

type Page = "dashboard" | "connection" | "history" | "status" | "deps" | "settings";

const NAV: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "connection", label: "Conexão", icon: Cable },
  { id: "history", label: "Histórico", icon: History },
  { id: "status", label: "Saúde do Sistema", icon: Activity },
  { id: "deps", label: "Dependências", icon: HardDriveDownload },
  { id: "settings", label: "Configurações", icon: Settings },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const { events, latest, alerts, conn } = useLiveData();
  const [profiles, setProfiles] = useState<PlantProfileRow[]>([]);
  const [activeProfile, setActiveProfile] = useState<PlantProfile | null>(null);

  const refreshProfiles = async () => {
    try {
      const list = await invoke<PlantProfileRow[]>("list_profiles");
      setProfiles(list);
      const active = await invoke<PlantProfile>("get_profile");
      setActiveProfile(active);
    } catch (e) {
      console.error("Erro ao carregar perfis na sidebar:", e);
    }
  };

  useEffect(() => {
    refreshProfiles();
  }, [page]);

  const connDot =
    conn.state === "connected"
      ? "bg-leaf-500"
      : conn.state === "reconnecting"
        ? "bg-amber-400 animate-pulse"
        : "bg-gray-600";

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-surface-border bg-surface-raised">
        <div className="flex items-center gap-2 px-4 py-5">
          <span className="rounded-lg bg-leaf-600/20 p-2 text-leaf-400">
            <Leaf size={20} />
          </span>
          <div>
            <h1 className="text-sm font-semibold leading-none">PlantiumAI</h1>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">
              Micro estufas inteligentes
            </p>
          </div>
        </div>

        {/* Seletor Rapido de Perfil */}
        {activeProfile && profiles.length > 0 && (
          <div className="px-4 pb-4">
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Cultura Ativa
            </label>
            <select
              value={profiles.find((p) => p.is_active)?.id || ""}
              onChange={async (e) => {
                const id = Number(e.target.value);
                await invoke("activate_profile", { id });
                refreshProfiles();
              }}
              className="mt-1 w-full bg-surface-overlay border border-surface-border text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:border-leaf-600 focus:outline-none"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 space-y-1 px-2">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                page === id
                  ? "bg-leaf-600/15 text-leaf-400"
                  : "text-gray-400 hover:bg-surface-overlay hover:text-gray-200"
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t border-surface-border px-4 py-3 text-xs text-gray-500">
          <p className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${connDot}`} />
            {conn.state === "connected"
              ? conn.port
              : conn.state === "reconnecting"
                ? "reconectando…"
                : "desconectado"}
          </p>
          {!isTauri && <p className="mt-1 text-amber-500/80">modo demo (browser)</p>}
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {NAV.find((n) => n.id === page)?.label}
        </h2>
        {page === "dashboard" && <Dashboard events={events} latest={latest} alerts={alerts} />}
        {page === "connection" && <ConnectionPage conn={conn} />}
        {page === "history" && <HistoryPage />}
        {page === "status" && <StatusPage />}
        {page === "deps" && <DependenciesPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

