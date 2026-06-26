import type { ReactNode } from "react";

export function AssistantHeroPanel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return <header className="assistant-hero"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</div></header>;
}
