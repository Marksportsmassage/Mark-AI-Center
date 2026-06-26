import type { ReactNode } from "react";

export function AssistantShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`assistant-page assistant-shell-v2 ${className}`}>{children}</div>;
}
