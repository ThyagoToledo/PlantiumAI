import { useEffect, useState } from "react";
import { Save, Sprout, Trash2, Plus, Bell, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { invoke } from "../lib/bridge";
import type { PlantProfile, PlantProfileRow } from "../lib/types";

export default function SettingsPage() {
  const [activeProfile, setActiveProfile] = useState<PlantProfile | null>(null);
  const [profiles, setProfiles] = useState<PlantProfileRow[]>([]);
  const [savedActive, setSavedActive] = useState(false);

  // Form para novo perfil
  const [newName, setNewName] = useState("");
  const [newMin, setNewMin] = useState(35);
  const [newMax, setNewMax] = useState(65);

  // Configuracoes gerais
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [autoIrrigate, setAutoIrrigate] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [savedSettings, setSavedSettings] = useState(false);

  async function loadData() {
    try {
      const active = await invoke<PlantProfile>("get_profile");
      setActiveProfile(active);

      const list = await invoke<PlantProfileRow[]>("list_profiles");
      setProfiles(list);

      const notify = await invoke<string | null>("load_setting", { key: "notifications_enabled" });
      setNotifyEnabled(notify === null ? true : notify === "true");

      const auto = await invoke<string | null>("load_setting", { key: "auto_irrigate" });
      setAutoIrrigate(auto === "true");

      const cool = await invoke<string | null>("load_setting", { key: "auto_cooldown_mins" });
      setCooldown(cool ? Number(cool) : 30);
    } catch (e) {
      console.error("Erro ao carregar configuracoes:", e);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveActiveProfile() {
    if (!activeProfile) return;
    try {
      await invoke("set_profile", {
        name: activeProfile.name,
        idealMin: activeProfile.ideal_moisture_min,
        idealMax: activeProfile.ideal_moisture_max,
      });
      setSavedActive(true);
      setTimeout(() => setSavedActive(false), 2000);
      loadData();
    } catch (e) {
      alert("Erro ao salvar perfil ativo: " + String(e));
    }
  }

  async function handleAddProfile() {
    if (!newName.trim()) return;
    try {
      await invoke("add_profile", {
        name: newName,
        idealMin: newMin,
        idealMax: newMax,
      });
      setNewName("");
      setNewMin(35);
      setNewMax(65);
      loadData();
    } catch (e) {
      alert("Erro ao adicionar perfil: " + String(e));
    }
  }

  async function handleDeleteProfile(id: number) {
    try {
      await invoke("delete_profile", { id });
      loadData();
    } catch (e) {
      alert(String(e));
    }
  }

  async function handleActivateProfile(id: number) {
    try {
      await invoke("activate_profile", { id });
      loadData();
    } catch (e) {
      alert(String(e));
    }
  }

  async function saveSystemSettings() {
    try {
      await invoke("save_setting", { key: "notifications_enabled", value: String(notifyEnabled) });
      await invoke("save_setting", { key: "auto_irrigate", value: String(autoIrrigate) });
      await invoke("save_setting", { key: "auto_cooldown_mins", value: String(cooldown) });
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2000);
    } catch (e) {
      alert("Erro ao salvar configuracoes: " + String(e));
    }
  }

  if (!activeProfile) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Coluna Esquerda: Perfil Ativo e Cadastro */}
      <div className="space-y-6">
        {/* Perfil Ativo */}
        <div className="card space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <Sprout size={16} /> Perfil Ativo
          </h3>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-gray-500">Nome / cultura</span>
            <input
              className="input w-full"
              value={activeProfile.name}
              onChange={(e) => setActiveProfile({ ...activeProfile, name: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-gray-500">Umidade ideal minima (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input w-full"
                value={activeProfile.ideal_moisture_min}
                onChange={(e) =>
                  setActiveProfile({ ...activeProfile, ideal_moisture_min: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-gray-500">Umidade ideal maxima (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input w-full"
                value={activeProfile.ideal_moisture_max}
                onChange={(e) =>
                  setActiveProfile({ ...activeProfile, ideal_moisture_max: Number(e.target.value) })
                }
              />
            </label>
          </div>

          <p className="text-xs text-gray-500">
            Estes limites alimentam os alertas e a decisao de irrigacao: critico abaixo de{" "}
            {(activeProfile.ideal_moisture_min * 0.5).toFixed(0)}%, encharcado acima de{" "}
            {(activeProfile.ideal_moisture_max * 1.2).toFixed(0)}%.
          </p>

          <button className="btn-primary" onClick={saveActiveProfile}>
            <Save size={16} /> {savedActive ? "Salvo!" : "Salvar Perfil Ativo"}
          </button>
        </div>

        {/* Adicionar Perfil */}
        <div className="card space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <Plus size={16} /> Novo Perfil de Planta
          </h3>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-gray-500">Nome da cultura</span>
            <input
              className="input w-full"
              value={newName}
              placeholder="Ex: Tomate Cereja"
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-gray-500">Umidade minima (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input w-full"
                value={newMin}
                onChange={(e) => setNewMin(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-gray-500">Umidade maxima (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input w-full"
                value={newMax}
                onChange={(e) => setNewMax(Number(e.target.value))}
              />
            </label>
          </div>

          <button className="btn-primary" onClick={handleAddProfile} disabled={!newName.trim()}>
            Adicionar Cultura
          </button>
        </div>
      </div>

      {/* Coluna Direita: Lista de Perfis e Parametros de Sistema */}
      <div className="space-y-6">
        {/* Lista de Perfis */}
        <div className="card space-y-4">
          <h3 className="text-sm font-medium text-gray-400">Outras Culturas Cadastradas</h3>
          {profiles.length === 0 ? (
            <p className="text-xs text-gray-600">Nenhuma cultura cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-lg p-3 border ${
                    p.is_active
                      ? "border-leaf-600/30 bg-leaf-950/10"
                      : "border-surface-border bg-surface-overlay/20"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-gray-400">
                      Umidade ideal: {p.ideal_moisture_min}% a {p.ideal_moisture_max}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!p.is_active && (
                      <button
                        onClick={() => handleActivateProfile(p.id)}
                        className="rounded bg-surface-overlay border border-surface-border px-2.5 py-1 text-xs hover:text-gray-200"
                      >
                        Ativar
                      </button>
                    )}
                    {p.is_active && (
                      <span className="rounded bg-leaf-600/20 px-2 py-1 text-[10px] text-leaf-400 border border-leaf-600/30">
                        Ativo
                      </span>
                    )}
                    {!p.is_active && (
                      <button
                        onClick={() => handleDeleteProfile(p.id)}
                        className="rounded border border-red-950/40 p-1.5 text-red-400 hover:bg-red-950/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parametros do Sistema */}
        <div className="card space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <Shield size={16} /> Parametros do Dispositivo
          </h3>

          {/* Notificacoes */}
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium flex items-center gap-2">
                <Bell size={14} /> Notificacoes Nativas
              </p>
              <p className="text-xs text-gray-500">
                Emitir alerta no SO quando os sensores entrarem em nivel critico.
              </p>
            </div>
            <button
              onClick={() => setNotifyEnabled(!notifyEnabled)}
              className="text-gray-400 hover:text-gray-200"
            >
              {notifyEnabled ? (
                <ToggleRight size={32} className="text-leaf-500" />
              ) : (
                <ToggleLeft size={32} className="text-gray-600" />
              )}
            </button>
          </div>

          {/* Modo automatico */}
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Irrigacao automatica (Estufa+)</p>
              <p className="text-xs text-gray-500">
                Acionar automaticamente a valvula por serial em niveis criticos.
              </p>
            </div>
            <button
              onClick={() => setAutoIrrigate(!autoIrrigate)}
              className="text-gray-400 hover:text-gray-200"
            >
              {autoIrrigate ? (
                <ToggleRight size={32} className="text-leaf-500" />
              ) : (
                <ToggleLeft size={32} className="text-gray-600" />
              )}
            </button>
          </div>

          {/* Cooldown */}
          {autoIrrigate && (
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-gray-500">
                Intervalo de Cooldown (minutos)
              </span>
              <input
                type="number"
                min={1}
                max={1440}
                className="input w-full"
                value={cooldown}
                onChange={(e) => setCooldown(Number(e.target.value))}
              />
              <span className="mt-1 block text-[10px] text-gray-500">
                Tempo minimo de espera entre dois acionamentos automaticos de irrigacao.
              </span>
            </label>
          )}

          <button className="btn-primary" onClick={saveSystemSettings}>
            <Save size={16} /> {savedSettings ? "Salvo!" : "Salvar Configurações"}
          </button>
        </div>
      </div>
    </div>
  );
}
