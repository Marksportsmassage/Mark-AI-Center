"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { buildCapitalPlan } from "@/lib/decisionSimulator";
import { getClientDb } from "@/lib/firebase/client";
import { safeJson } from "@/lib/ui/format";
import type { CapitalAllocation, FinanceSnapshot } from "@/types/firestore";

function CapitalPlanData({ uid }: { uid: string }) {
  const snapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const allocations = useFirestoreCollection<CapitalAllocation>("capital_allocations", recent20, true);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const plan = useMemo(() => buildCapitalPlan({ userId: uid, snapshot: snapshots.items[0] ?? null }), [snapshots.items, uid]);
  async function createPlan() {
    setBusy(true);
    try {
      const db = getClientDb();
      const ref = await addDoc(collection(db, "capital_allocations"), { ...plan, created_at: serverTimestamp(), updated_at: serverTimestamp() });
      await addDoc(collection(db, "audit_logs"), { user_id: uid, action: "capital_plan.create_draft", target_collection: "capital_allocations", target_id: ref.id, before: null, after: { external_action_allowed: false }, reason: "Created capital plan draft. No transfer, trade, or external action executed.", created_at: serverTimestamp(), updated_at: serverTimestamp() });
      setCreatedId(ref.id);
    } finally {
      setBusy(false);
    }
  }
  return <div className="grid"><header className="page-header"><div><h1>資本配置計畫</h1><p>保護安全現金水位，產生 review-gated capital allocation draft。</p></div><div className="action-row"><button className="button compact" disabled={busy} onClick={createPlan}>建立 capital allocation draft</button><Link className="button secondary compact" href="/decision-lab">決策實驗室</Link></div></header>{snapshots.error || allocations.error ? <section className="panel"><p className="muted">{snapshots.error ?? allocations.error}</p></section> : null}{createdId ? <section className="panel"><p>已建立：<span className="mono">{createdId}</span></p></section> : null}<section className="panel"><h2>Capital Plan Draft Preview</h2><div className="detail-grid"><div><strong>安全現金水位</strong><p>{plan.safety_cash_reserve ?? "需要 Mark 補資料"}</p></div><div><strong>可投資 / 創業測試資金</strong><p>{plan.deployable_capital ?? "需要 finance baseline"}</p></div><div><strong>建議</strong><p>{plan.summary}</p></div><div><strong>風險</strong><p>{plan.risk_level}</p></div></div><pre className="json-block">{safeJson({ allocation_items: plan.allocation_items, risk_items: plan.risk_items, missing_required_fields: plan.missing_required_fields })}</pre></section><section className="panel"><h2>Existing Capital Allocations</h2><div className="list">{allocations.items.length ? allocations.items.map((item) => <article className="item" key={item.id}><h3>{item.title}</h3><p>{item.summary}</p></article>) : <p className="muted">No capital allocation drafts.</p>}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <CapitalPlanData uid={uid} />}</ProtectedPage>;
}
