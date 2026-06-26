export function AssistantPriorityCard({ title, body }: { title: string; body: string }) {
  return <article className="assistant-glass-card card"><h3>{title}</h3><p>{body}</p></article>;
}
