"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addDoc, collection, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { buildExpenseSignalSnapshot } from "@/lib/financeDecisionIntelligence";
import { displayText } from "@/lib/ui/safe";
import type { ExpenseSignal, FinanceDecision } from "@/types/firestore";

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function ExpenseSignals({ uid }: { uid: string }) {
  const decisions = useFirestoreCollection<FinanceDecision>("finance_decisions", [orderBy("created_at", "desc"), limit(200)], true);
  const signals = useFirestoreCollection<ExpenseSignal>("expense_signals", [orderBy("created_at", "desc"), limit(12)], true);
  const [busy, setBusy] = useState(false);
  const currentMonthDecisions = useMemo(() => decisions.items.filter((item) => (item.occurred_at ?? item.created_at ?? "").slice(0, 7) === monthKey() || !item.occurred_at), [decisions.items]);
  const draft = useMemo(() => buildExpenseSignalSnapshot(currentMonthDecisions, uid, monthKey()), [currentMonthDecisions, uid]);

  async function saveSnapshot() {
    setBusy(true);
    try {
      const db = getClientDb();
      const ref = await addDoc(collection(db, "expense_signals"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
      await addDoc(collection(db, "audit_logs"), { user_id: uid, action: "expense_signal.update", target_collection: "expense_signals", target_id: ref.id, before: null, after: { month_key: draft.month_key, threshold_status: draft.threshold_status }, reason: "Updated monthly expense signal snapshot. No external action executed.", created_at: serverTimestamp(), updated_at: serverTimestamp() });
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid"><header className="page-header"><div><h1>警訊支出累積</h1><p>本月重大財務訊號，不做流水帳。</p></div><div className="action-row"><button className="button compact" disabled={busy} onClick={saveSnapshot}>更新本月訊號</button><Link className="button secondary compact" href="/finance-decisions">重大財務決策</Link></div></header>{decisions.error || signals.error ? <section className="panel"><p className="muted">{decisions.error ?? signals.error}</p></section> : null}<section className="panel"><h2>本月風險門檻</h2><div className="stat-grid"><div className="stat-card"><strong>警訊支出</strong><span>{draft.total_warning_spending}</span></div><div className="stat-card"><strong>資產型支出</strong><span>{draft.total_asset_purchase}</span></div><div className="stat-card"><strong>投資型支出</strong><span>{draft.total_investment_related}</span></div><div className="stat-card"><strong>創業測試</strong><span>{draft.total_startup_test}</span></div><div className="stat-card"><strong>信用卡</strong><span>{draft.total_credit_card_payment}</span></div><div className="stat-card"><strong>分期月壓力</strong><span>{draft.total_installments_monthly}</span></div></div><p className="muted">threshold_status: {draft.threshold_status}</p><p>{draft.risk_summary}</p></section><section className="panel"><h2>是否需要提醒 Mark</h2>{draft.threshold_status === "normal" ? <p className="muted">目前不需要額外提醒。</p> : <p className="muted">需要 Mark review：{draft.triggered_rules.join("、") || "有警訊項目"}</p>}<ul>{draft.warning_items.length ? draft.warning_items.map((item) => <li key={item}>{item}</li>) : <li>目前沒有警訊支出。</li>}</ul></section><section className="panel"><h2>歷史 Snapshot</h2><div className="list">{signals.items.length === 0 ? <p className="muted">尚未保存 expense signal snapshot。</p> : signals.items.map((item) => <article className="item" key={item.id}><div className="item-header"><h3>{displayText(item.month_key)}</h3><span className="badge review">{displayText(item.threshold_status)}</span></div><p>{displayText(item.risk_summary)}</p></article>)}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <ExpenseSignals uid={uid} />}</ProtectedPage>;
}
