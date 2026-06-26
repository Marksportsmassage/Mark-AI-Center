import Link from "next/link";

export function AssistantSidebar() {
  return <nav className="assistant-sidebar-mini"><Link href="/assistant">助理</Link><Link href="/assistant-universe">宇宙</Link><Link href="/income-lab">收入</Link><Link href="/agent-lab">Agent</Link></nav>;
}
