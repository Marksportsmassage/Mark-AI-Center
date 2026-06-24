"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, getDocs, limit, query, serverTimestamp } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import type { KnowledgeSop } from "@/types/firestore";

function KnowledgeSopClient() {
  const [sops, setSops] = useState<KnowledgeSop[]>([]);
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function load() { setError(null); try { const snap = await getDocs(query(collection(getClientDb(), "knowledge_sop"), limit(200))); setSops(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as KnowledgeSop)); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Failed to load SOPs."); } }
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => sops.filter((sop) => (!category || sop.category === category) && (!projectId || sop.project_id === projectId) && (!status || sop.status === status)), [sops, category, projectId, status]);
  async function create() { await addDoc(collection(getClientDb(), "knowledge_sop"), { title: "Manual SOP Draft", category: "other", project_id: "knowledge_sop", agent_ids: ["knowledge_ai"], summary: "Draft created by Mark.", content: "待 Mark 補內容", rules: ["所有正式動作需 Mark Review"], examples: [], forbidden_actions: ["no external actions", "no secret writes"], source_type: "manual", source_id: null, status: "draft", need_mark_review: true, review_status: "pending", created_at: serverTimestamp(), updated_at: serverTimestamp() }); await load(); }
  return <div className="grid"><header className="page-header"><div><h1>Knowledge SOP</h1><p>SOP drafts require Mark review and do not automatically alter AI behavior.</p></div><div className="action-row"><button className="button compact" onClick={create}>建立新 SOP draft</button><Link className="button secondary compact" href="/command-center">Command Center</Link></div></header>{error ? <section className="panel"><p className="muted">{error}</p></section> : null}<section className="panel"><h2>Filters</h2><div className="detail-grid"><label>category<input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="finance_rule" /></label><label>project_id<input value={projectId} onChange={(event) => setProjectId(event.target.value)} placeholder="knowledge_sop" /></label><label>status<input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="draft" /></label></div></section><section className="panel"><h2>SOP List</h2><div className="list">{filtered.length === 0 ? <p className="muted">No SOP matches current filters.</p> : filtered.map((sop) => <Link className="item" href={`/knowledge-sop/${sop.id}`} key={sop.id}><div className="item-header"><h3>{sop.title}</h3><span className="badge review">{sop.status}</span></div><p>{sop.summary ?? sop.content}</p><div className="badge-row"><span className="badge">{sop.category ?? sop.domain}</span><span className="badge">{sop.project_id ?? "no project"}</span>{sop.need_mark_review ? <span className="badge review">Mark review</span> : null}</div></Link>)}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{() => <KnowledgeSopClient />}</ProtectedPage>;
}
