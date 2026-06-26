import type { ReactNode } from "react";

export function AssistantBranchDrawer({ title, children }: { title: string; children: ReactNode }) {
  return <aside className="drawer assistant-branch-drawer"><h2>{title}</h2>{children}</aside>;
}
