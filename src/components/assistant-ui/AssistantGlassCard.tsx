import type { ReactNode } from "react";

export function AssistantGlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`assistant-glass-card panel ${className}`}>{children}</section>;
}
