import Link from "next/link";

export function AssistantReviewCard({ title, href }: { title: string; href: string }) {
  return <Link className="assistant-glass-card card" href={href}><h3>{title}</h3><p>需要 Mark 審核</p></Link>;
}
