import type { CSSProperties } from "react";

export function AssistantMetricRing({ value, label }: { value: number; label: string }) {
  return <div className="assistant-metric-ring" style={{ "--ring-value": `${Math.max(0, Math.min(100, value))}%` } as CSSProperties}><span><strong>{value}%</strong><small>{label}</small></span></div>;
}
