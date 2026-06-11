import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: "ok" | "warn" | "crit" | "none";
}

const ACCENT: Record<NonNullable<Props["accent"]>, string> = {
  ok: "text-leaf-400",
  warn: "text-amber-400",
  crit: "text-red-400",
  none: "text-gray-200",
};

export default function StatCard({ icon, label, value, sub, accent = "none" }: Props) {
  return (
    <div className="card flex items-center gap-3">
      <div className="rounded-lg bg-surface-overlay p-2.5 text-leaf-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className={`truncate text-xl font-semibold ${ACCENT[accent]}`}>{value}</p>
        {sub && <p className="truncate text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}
