export function AssistantRiskCard({ title, risk }: { title: string; risk: string }) {
  return <article className={`assistant-glass-card card risk-${risk}`}><h3>{title}</h3><p>{risk}</p></article>;
}
