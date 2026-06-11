import { useEffect, useState } from "react";
import { Save, Sprout } from "lucide-react";
import { invoke } from "../lib/bridge";
import type { PlantProfile } from "../lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<PlantProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    invoke<PlantProfile>("get_profile").then(setProfile);
  }, []);

  async function save() {
    if (!profile) return;
    await invoke("set_profile", {
      name: profile.name,
      idealMin: profile.ideal_moisture_min,
      idealMax: profile.ideal_moisture_max,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) return null;

  return (
    <div className="max-w-xl space-y-4">
      <div className="card space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Sprout size={16} /> Perfil da planta monitorada
        </h3>

        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">Nome / cultura</span>
          <input
            className="input w-full"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-gray-500">Umidade ideal mínima (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="input w-full"
              value={profile.ideal_moisture_min}
              onChange={(e) =>
                setProfile({ ...profile, ideal_moisture_min: Number(e.target.value) })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-gray-500">Umidade ideal máxima (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="input w-full"
              value={profile.ideal_moisture_max}
              onChange={(e) =>
                setProfile({ ...profile, ideal_moisture_max: Number(e.target.value) })
              }
            />
          </label>
        </div>

        <p className="text-xs text-gray-500">
          Estes limites alimentam os alertas e a decisão de irrigação: crítico abaixo
          de {(profile.ideal_moisture_min * 0.5).toFixed(0)}%, encharcado acima de{" "}
          {(profile.ideal_moisture_max * 1.2).toFixed(0)}%.
        </p>

        <button className="btn-primary" onClick={save}>
          <Save size={16} /> {saved ? "Salvo!" : "Salvar perfil"}
        </button>
      </div>
    </div>
  );
}
