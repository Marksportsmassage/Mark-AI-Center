"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { limit, orderBy } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { displayText } from "@/lib/ui/safe";
import type { CodexJob } from "@/types/firestore";

function CodexJobsData() {
  const jobs = useFirestoreCollection<CodexJob>("codex_jobs", [orderBy("created_at", "desc"), limit(100)], true);
  const [status, setStatus] = useState("");
  const filtered = useMemo(() => jobs.items.filter((job) => !status || job.status === status), [jobs.items, status]);
  return <div className="grid"><header className="page-header"><div><h1>Codex Jobs</h1><p>Read-only draft queue. No Codex API, PR, deploy, or external task is submitted.</p></div><Link className="button secondary compact" href="/command-center">Command Center</Link></header>{jobs.error ? <section className="panel"><p className="muted">{jobs.error}</p></section> : null}<section className="panel"><h2>Filter</h2><label>status<input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="draft" /></label></section><section className="panel"><h2>Queue</h2><div className="list">{filtered.length === 0 ? <p className="muted">No Codex job drafts.</p> : filtered.map((job) => <Link className="item" href={`/codex-jobs/${job.id}`} key={job.id}><div className="item-header"><h3>{displayText(job.title, "Codex Job Draft")}</h3><span className="badge review">{displayText(job.status)}</span></div><p>{displayText(job.goal, "尚無 job goal")}</p><div className="badge-row"><span className="badge">external false</span>{job.needs_mark_review ? <span className="badge review">Mark review</span> : null}</div></Link>)}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{() => <CodexJobsData />}</ProtectedPage>;
}
