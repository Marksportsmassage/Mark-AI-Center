"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { buildRecoveryPlan, createRecoveryPlanDraft } from "@/lib/decisionSimulator";
import { getClientDb } from "@/lib/firebase/client";
import { parseNullableNumber } from "@/lib/financeReviewActions";
import { displayText, safeJoin } from "@/lib/ui/safe";
import type { RecoveryPlan } from "@/types/firestore";

function RecoveryPlansData({ uid }: { uid: string }) {
  const plans = useFirestoreCollection<RecoveryPlan>("recovery_plans", recent20, true);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const filtered = useMemo(() => plans.items.filter((item) => (!status || item.status === status) && (!source || item.source_collection === source)), [plans.items, source, status]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const draft = buildRecoveryPlan({ userId: uid, title: String(form.get("title") ?? "Manual"), cost: parseNullableNumber(form.get("cost")), sourceCollection: String(form.get("source_collection") ?? "") || null, sourceId: String(form.get("source_id") ?? "") || null });
      const result = await createRecoveryPlanDraft(getClientDb(), draft);
      setCreatedId(result.recoveryPlanId);
      event.currentTarget.reset();
    } finally {
      setBusy(false);
    }
  }
  return <div className="grid"><header className="page-header"><div><h1>支出回收計畫</h1><p>追蹤回本方法、抵銷方法、期限與停損線。只建立草稿，不做外部動作。</p></div><div className="action-row"><Link className="button secondary compact" href="/decision-lab">決策實驗室</Link><Link className="button secondary compact" href="/today">Today</Link></div></header>{plans.error ? <section className="panel"><p className="muted">{plans.error}</p></section> : null}<section className="panel"><h2>建立 Recovery Plan Draft</h2><form className="grid" onSubmit={create}><div className="detail-grid"><label>title<input name="title" required /></label><label>cost_to_recover<input name="cost" type="number" min="0" /></label><label>source_collection<input name="source_collection" placeholder="finance_decisions" /></label><label>source_id<input name="source_id" /></label></div><button className="button compact" disabled={busy}>建立回收計畫草稿</button>{createdId ? <p className="muted">已建立：<span className="mono">{createdId}</span></p> : null}</form></section><section className="panel"><h2>Filters</h2><div className="detail-grid"><label>status<input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="draft" /></label><label>source_collection<input value={source} onChange={(event) => setSource(event.target.value)} placeholder="finance_decisions" /></label></div></section><section className="panel"><h2>Recovery Plans</h2><div className="list">{filtered.length ? filtered.map((item) => <article className="item" key={item.id}><div className="item-header"><h3>{displayText(item.title, "Recovery Plan")}</h3><span className="badge review">{item.status}</span></div><p>cost_to_recover: {displayText(item.cost_to_recover)}</p><p>回本方法：{safeJoin(item.recovery_methods)}</p><p>抵銷方法：{safeJoin(item.offset_methods)}</p><p>停損線：{safeJoin(item.stop_loss_conditions)}</p></article>) : <p className="muted">目前沒有符合條件的 recovery plans。</p>}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <RecoveryPlansData uid={uid} />}</ProtectedPage>;
}
