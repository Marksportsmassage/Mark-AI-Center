import { Activity } from "lucide-react";
import { dataFreshness } from "@/lib/staleness";

export function DataFreshnessBadge({ updatedAt, label = "資料新鮮度" }: { updatedAt?: Date | string | number | null; label?: string }) {
  const freshness = dataFreshness(updatedAt ?? new Date());

  return (
    <div className={`data-freshness-badge freshness-${freshness.level}`} aria-label={label}>
      <Activity size={16} />
      <span>{label}</span>
      <strong>{freshness.label}</strong>
    </div>
  );
}
