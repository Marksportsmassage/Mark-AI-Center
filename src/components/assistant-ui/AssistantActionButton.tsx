import Link from "next/link";
import type { ReactNode } from "react";

export function AssistantActionButton({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="assistant-action-button button compact" href={href}>{children}</Link>;
}
