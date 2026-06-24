"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { createClientProfileDraft, createClientSessionDraft } from "@/lib/nonFinanceOps";
import { safeJoin } from "@/lib/ui/safe";
import type { ClientProfile, ClientSession } from "@/types/firestore";

function ClientOpsData({ uid }: { uid: string }) {
  const clients = useFirestoreCollection<ClientProfile>("client_profiles", recent20, true);
  const sessions = useFirestoreCollection<ClientSession>("client_sessions", recent20, true);
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const error = clients.error ?? sessions.error;
  async function createProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("profile");
    try { const form = new FormData(event.currentTarget); const result = await createClientProfileDraft(getClientDb(), uid, { displayName: String(form.get("display_name") ?? ""), summary: String(form.get("case_summary") ?? ""), goals: String(form.get("goals") ?? ""), limitations: String(form.get("limitations") ?? ""), focus: String(form.get("training_focus") ?? ""), risks: String(form.get("risk_notes") ?? ""), next: String(form.get("next_session_focus") ?? "") }); setCreated(`${result.collection}/${result.id}`); event.currentTarget.reset(); } finally { setBusy(null); }
  }
  async function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("session");
    try { const form = new FormData(event.currentTarget); const result = await createClientSessionDraft(getClientDb(), uid, { clientId: String(form.get("client_id") ?? "") || null, date: String(form.get("session_date") ?? ""), notes: String(form.get("session_notes") ?? ""), exercises: String(form.get("exercises") ?? ""), response: String(form.get("response") ?? ""), nextPlan: String(form.get("next_plan") ?? ""), caution: String(form.get("caution_notes") ?? "") }); setCreated(`${result.collection}/${result.id}`); event.currentTarget.reset(); } finally { setBusy(null); }
  }
  return <div className="grid"><header className="page-header"><div><h1>客戶與課表管理</h1><p>記錄客戶狀態、課表、訓練重點、注意事項與回訪。非醫療診斷，不自動發訊息。</p></div><div className="action-row"><Link className="button secondary compact" href="/advisor-chat">Advisor</Link><Link className="button secondary compact" href="/review-queue">Review Queue</Link></div></header>{error ? <section className="panel"><p className="muted">{error}</p></section> : null}{created ? <section className="panel"><p>Created draft: <span className="mono">{created}</span></p></section> : null}<section className="panel"><h2>Create Client Profile Draft</h2><form className="grid" onSubmit={createProfile}><div className="detail-grid"><label>display_name<input name="display_name" required /></label><label>goals<input name="goals" /></label><label>limitations<input name="limitations" /></label><label>training_focus<input name="training_focus" /></label><label>risk_notes<input name="risk_notes" /></label><label>next_session_focus<input name="next_session_focus" /></label></div><label>case_summary<textarea name="case_summary" rows={3} /></label><button className="button compact" disabled={Boolean(busy)}>建立客戶草稿</button></form></section><section className="panel"><h2>Create Session Note Draft</h2><form className="grid" onSubmit={createSession}><div className="detail-grid"><label>client_id<input name="client_id" /></label><label>session_date<input name="session_date" type="date" /></label><label>exercises<input name="exercises" /></label><label>response<input name="response" /></label><label>next_plan<input name="next_plan" /></label><label>caution_notes<input name="caution_notes" placeholder="非醫療診斷，只記注意事項" /></label></div><label>session_notes<textarea name="session_notes" rows={3} /></label><button className="button compact" disabled={Boolean(busy)}>建立課表紀錄草稿</button></form></section><section className="panel"><h2>Clients</h2><div className="list">{clients.items.length ? clients.items.map((item) => <article className="item" key={item.id}><h3>{item.display_name}</h3><p>{item.case_summary}</p><p className="muted">focus: {safeJoin(item.training_focus)} / risks: {safeJoin(item.risk_notes)}</p></article>) : <p className="muted">尚未建立客戶草稿。</p>}</div></section><section className="panel"><h2>Sessions</h2><div className="list">{sessions.items.length ? sessions.items.map((item) => <article className="item" key={item.id}><h3>{item.session_date}</h3><p>{item.session_notes}</p><p className="muted">{item.next_plan}</p></article>) : <p className="muted">尚未建立 session draft。</p>}</div></section></div>;
}

export default function Page() { return <ProtectedPage>{(uid) => <ClientOpsData uid={uid} />}</ProtectedPage>; }
