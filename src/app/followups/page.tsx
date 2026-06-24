"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { buildDecisionFollowup, createDecisionFollowupDraft, updateDecisionFollowupStatus } from "@/lib/operatingCadence";
import { getClientDb } from "@/lib/firebase/client";
import type { DecisionFollowup } from "@/types/firestore";

function FollowupsData({ uid }: { uid: string }) {
  const followups = useFirestoreCollection<DecisionFollowup>("decision_followups", recent20, true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const filtered = useMemo(() => followups.items.filter((item) => !status || item.status === status), [followups.items, status]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    try {
      const form = new FormData(event.currentTarget);
      const result = await createDecisionFollowupDraft(getClientDb(), buildDecisionFollowup({ userId: uid, sourceCollection: String(form.get("source_collection") ?? "manual"), sourceId: String(form.get("source_id") ?? "manual"), title: String(form.get("title") ?? "Manual followup"), expectedResult: String(form.get("expected_result") ?? "") || null, followupDate: String(form.get("followup_date") ?? new Date().toISOString().slice(0, 10)) }));
      setCreatedId(result.followupId);
      event.currentTarget.reset();
    } finally {
      setBusy(null);
    }
  }
  async function act(id: string, nextStatus: DecisionFollowup["status"]) {
    setBusy(id);
    try {
      await updateDecisionFollowupStatus(getClientDb(), id, uid, nextStatus);
    } finally {
      setBusy(null);
    }
  }
  return <div className="grid"><header className="page-header"><div><h1>決策追蹤</h1><p>追蹤 decision / recovery plan 的預期與實際結果。</p></div><Link className="button secondary compact" href="/today">Today</Link></header><section className="panel"><h2>建立 Followup</h2><form className="grid" onSubmit={create}><div className="detail-grid"><label>title<input name="title" required /></label><label>source_collection<input name="source_collection" placeholder="finance_decisions" /></label><label>source_id<input name="source_id" /></label><label>expected_result<input name="expected_result" /></label><label>followup_date<input name="followup_date" type="date" /></label></div><button className="button compact" disabled={Boolean(busy)}>建立 followup</button>{createdId ? <p className="muted">已建立：<span className="mono">{createdId}</span></p> : null}</form></section><section className="panel"><h2>Filters</h2><label>status<input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="pending / missed / done" /></label></section><section className="panel"><h2>Followups</h2><div className="list">{filtered.length ? filtered.map((item) => <article className="item" key={item.id}><div className="item-header"><h3>{item.title}</h3><span className="badge review">{item.status}</span></div><p>{item.followup_date} / {item.next_action}</p><div className="action-row"><button className="button compact" disabled={Boolean(busy)} onClick={() => act(item.id, "done")}>Mark done</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act(item.id, "missed")}>Mark missed</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act(item.id, "archived")}>Archive</button></div></article>) : <p className="muted">目前沒有 followups。</p>}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <FollowupsData uid={uid} />}</ProtectedPage>;
}
