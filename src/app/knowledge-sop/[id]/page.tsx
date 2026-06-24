"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { safeJson } from "@/lib/ui/format";
import type { KnowledgeSop } from "@/types/firestore";

function SopDetail({ id, uid }: { id: string; uid: string }) {
  const [sop, setSop] = useState<KnowledgeSop | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function load() { setError(null); try { const snap = await getDoc(doc(getClientDb(), "knowledge_sop", id)); setSop(snap.exists() ? ({ id: snap.id, ...snap.data() } as KnowledgeSop) : null); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Failed to load SOP."); } }
  useEffect(() => { void load(); }, [id]);
  async function act(status: "active" | "archived" | "draft") { const db = getClientDb(); const before = sop; await updateDoc(doc(db, "knowledge_sop", id), { status, updated_at: serverTimestamp() }); await addDoc(collection(db, "audit_logs"), { user_id: uid, action: `knowledge_sop.${status}`, target_collection: "knowledge_sop", target_id: id, before, after: { status }, reason: "SOP review action; no external behavior or prompt behavior changed.", created_at: serverTimestamp(), updated_at: serverTimestamp() }); await load(); }
  if (error) return <section className="panel"><p className="muted">{error}</p></section>;
  if (!sop) return <p className="muted">Loading SOP...</p>;
  return <div className="grid"><header className="page-header"><div><h1>{sop.title}</h1><p>{sop.category} · {sop.project_id} · source {sop.source_type}</p></div><Link className="button secondary compact" href="/knowledge-sop">Back</Link></header><section className="panel"><h2>Content</h2><div className="detail-grid"><div><strong>summary</strong><p>{sop.summary}</p></div><div><strong>status</strong><p>{sop.status}</p></div><div><strong>need_mark_review</strong><p>{String(sop.need_mark_review)}</p></div></div><pre className="json-block">{safeJson({ content: sop.content, rules: sop.rules, examples: sop.examples, forbidden_actions: sop.forbidden_actions })}</pre><div className="action-row"><button className="button compact" onClick={() => act("active")}>Mark as Active</button><button className="button secondary compact" onClick={() => act("archived")}>Archive</button><button className="button secondary compact" onClick={() => act("draft")}>Need More Info</button></div></section></div>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  useEffect(() => { void params.then((value) => setId(value.id)); }, [params]);
  return <ProtectedPage>{(uid) => id ? <SopDetail id={id} uid={uid} /> : null}</ProtectedPage>;
}
