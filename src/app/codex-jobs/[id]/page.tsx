"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { updateCodexJobStatus } from "@/lib/codexJobs";
import { createSopDraftFromCodexJob } from "@/lib/sop";
import { safeJson } from "@/lib/ui/format";
import { asArray, displayText } from "@/lib/ui/safe";
import type { CodexJob } from "@/types/firestore";

function CodexJobDetail({ id, uid }: { id: string; uid: string }) {
  const [job, setJob] = useState<CodexJob | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sopId, setSopId] = useState<string | null>(null);
  async function load() {
    setError(null);
    try {
      const snap = await getDoc(doc(getClientDb(), "codex_jobs", id));
      setJob(snap.exists() ? ({ id: snap.id, ...snap.data() } as CodexJob) : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load Codex job.");
    } finally {
      setLoaded(true);
    }
  }
  useEffect(() => { void load(); }, [id]);
  async function setStatus(status: CodexJob["status"]) { setBusy(status); try { await updateCodexJobStatus(getClientDb(), id, status, uid); await load(); } finally { setBusy(null); } }
  async function createSop() { setBusy("sop"); try { const result = await createSopDraftFromCodexJob(getClientDb(), id, uid); setSopId(result.sopId); } finally { setBusy(null); } }
  if (error) return <section className="panel"><h2>Codex job error</h2><p className="muted">{error}</p><button className="button compact" onClick={load}>Retry</button></section>;
  if (!loaded) return <p className="muted">Loading Codex job...</p>;
  if (!job) return <section className="panel"><h2>Codex job not found</h2><p className="muted">找不到這筆 Codex job draft，可能已被封存或刪除。</p><Link className="button secondary compact" href="/codex-jobs">Codex Jobs</Link></section>;
  const prompt = `Goal:\n${displayText(job.goal)}\n\nInstructions:\n${displayText(job.instructions)}\n\nTarget files:\n${asArray<string>(job.target_files).join("\n")}\n\nTests:\n${asArray<string>(job.test_commands).join("\n")}\n\nForbidden:\n${asArray<string>(job.forbidden_actions).join("\n")}`;
  return <div className="grid"><header className="page-header"><div><h1>{displayText(job.title, "Codex Job Draft")}</h1><p>Draft only. external_action_allowed=false.</p></div><Link className="button secondary compact" href="/codex-jobs">Codex Jobs</Link></header><section className="panel"><h2>Job Detail</h2><div className="detail-grid"><div><strong>goal</strong><p>{displayText(job.goal)}</p></div><div><strong>status</strong><p>{displayText(job.status)}</p></div><div><strong>needs_mark_review</strong><p>{String(Boolean(job.needs_mark_review))}</p></div><div><strong>external_action_allowed</strong><p>{String(Boolean(job.external_action_allowed))}</p></div></div><pre className="json-block">{safeJson({ instructions: job.instructions, target_files: asArray(job.target_files), test_commands: asArray(job.test_commands), forbidden_actions: asArray(job.forbidden_actions) })}</pre></section><section className="panel"><h2>Copy Prompt</h2><textarea readOnly value={prompt} rows={12} /></section><section className="panel"><h2>Actions</h2><div className="action-row"><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => setStatus("archived")}>Archive</button><button className="button compact" disabled={Boolean(busy)} onClick={() => setStatus("waiting_review")}>Mark Waiting Review</button><button className="button compact" disabled={Boolean(busy)} onClick={createSop}>Create SOP Draft from Codex Job</button></div>{sopId ? <p className="muted">SOP draft: <Link className="mono" href={`/knowledge-sop/${sopId}`}>{sopId}</Link></p> : null}</section></div>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  useEffect(() => { void params.then((value) => setId(value.id)); }, [params]);
  return <ProtectedPage>{(uid) => id ? <CodexJobDetail id={id} uid={uid} /> : null}</ProtectedPage>;
}
