import { TimeContextBadge } from "./TimeContextBadge";

export function AssistantTopBar({ title }: { title: string }) {
  return <div className="assistant-topbar"><strong>{title}</strong><TimeContextBadge /></div>;
}
