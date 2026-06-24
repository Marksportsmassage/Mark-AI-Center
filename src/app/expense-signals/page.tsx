"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addDoc, collection, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { buildExpenseSignalSnapshot, evaluateExpenseThreshold } from "@/lib/financeDecisionIntelligence";
import { displayText, safeJoin } from "@/lib/ui/safe";
import type { CreditCardObligation, ExpenseSignal, FinanceDecision, FinancialProfile } from "@/types/firestore";

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function ExpenseSignals({ uid }: { uid: string }) {
  const decisions = useFirestoreCollection<FinanceDecision>("finance_decisions", [orderBy("created_at", "desc"), limit(200)], true);
  const obligations = useFirestoreCollection<CreditCardObligation>("credit_card_obligations", [orderBy("created_at", "desc"), limit(50)], true);
  const profiles = useFirestoreCollection<FinancialProfile>("financial_profile", [orderBy("created_at", "desc"), limit(1)], true);
  const signals = useFirestoreCollection<ExpenseSignal>("expense_signals", [orderBy("created_at", "desc"), limit(12)], true);
  const [busy, setBusy] = useState(false);
  const currentMonthDecisions = useMemo(() => decisions.items.filter((item) => (item.occurred_at ?? item.created_at ?? "").slice(0, 7) === monthKey() || !item.occurred_at), [decisions.items]);
  const threshold = useMemo(() => evaluateExpenseThreshold({ decisions: currentMonthDecisions, obligations: obligations.items, profile: profiles.items[0] ?? null }), [currentMonthDecisions, obligations.items, profiles.items]);
  const draft = useMemo(() => {
    const base = buildExpenseSignalSnapshot(currentMonthDecisions, uid, monthKey());
    return {
      ...base,
      threshold_status: threshold.threshold_status,
      triggered_rules: Array.from(new Set([...base.triggered_rules, ...threshold.triggered_rules])),
      missing_required_fields: threshold.missing_required_fields,
      next_actions: threshold.next_actions,
      total_credit_card_payment: threshold.totals.creditCardPressure,
      total_warning_spending: Math.max(base.total_warning_spending, threshold.totals.warningSpending),
      total_asset_purchase: Math.max(base.total_asset_purchase, threshold.totals.assetPurchase),
      total_investment_related: Math.max(base.total_investment_related, threshold.totals.investmentRelated),
      total_startup_test: Math.max(base.total_startup_test, threshold.totals.startupTest)
    };
  }, [currentMonthDecisions, threshold, uid]);

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

  return <div className="grid"><header className="page-header"><div><h1>警訊支出累積</h1><p>本月重大財務訊號，不做流水帳。</p></div><div className="action-row"><button className="button compact" disabled={busy} onClick={saveSnapshot}>更新本月訊號</button><Link className="button secondary compact" href="/finance-decisions">重大財務決策</Link></div></header>{decisions.error || signals.error || obligations.error || profiles.error ? <section className="panel"><p className="muted">{decisions.error ?? signals.error ?? obligations.error ?? profiles.error}</p></section> : null}<section className="panel"><h2>本月風險門檻</h2><div className="stat-grid"><div className="stat-card"><strong>normal / watch / warning / critical</strong><span>{draft.threshold_status}</span></div><div className="stat-card"><strong>本月大筆支出</strong><span>{draft.total_warning_spending}</span></div><div className="stat-card"><strong>資產型支出</strong><span>{draft.total_asset_purchase}</span></div><div className="stat-card"><strong>投資型支出</strong><span>{draft.total_investment_related}</span></div><div className="stat-card"><strong>創業測試支出</strong><span>{draft.total_startup_test}</span></div><div className="stat-card"><strong>信用卡 / 分期月壓力</strong><span>{draft.total_credit_card_payment + draft.total_installments_monthly}</span></div></div><p className="muted">threshold_status: {draft.threshold_status}</p><p>{draft.risk_summary}</p>{draft.missing_required_fields?.length ? <p className="muted">missing_required_fields: {safeJoin(draft.missing_required_fields, "、")}</p> : null}</section><section className="panel"><h2>Triggered rules / 下一步建議</h2>{draft.threshold_status === "normal" ? <p className="muted">目前不需要額外提醒。</p> : <p className="muted">需要 Mark review：{draft.triggered_rules.join("、") || "有警訊項目"}</p>}<div className="detail-grid"><div><strong>triggered_rules</strong><ul>{draft.triggered_rules.length ? draft.triggered_rules.map((item) => <li key={item}>{item}</li>) : <li>目前沒有觸發規則。</li>}</ul></div><div><strong>warning_items</strong><ul>{draft.warning_items.length ? draft.warning_items.map((item) => <li key={item}>{item}</li>) : <li>目前沒有警訊支出。</li>}</ul></div><div><strong>next_actions</strong><ul>{(draft.next_actions ?? ["維持記錄，僅 review 重大項目"]).map((item) => <li key={item}>{item}</li>)}</ul></div></div></section><section className="panel"><h2>歷史 Snapshot</h2><div className="list">{signals.items.length === 0 ? <p className="muted">尚未保存 expense signal snapshot。</p> : signals.items.map((item) => <article className="item" key={item.id}><div className="item-header"><h3>{displayText(item.month_key)}</h3><span className="badge review">{displayText(item.threshold_status)}</span></div><p>{displayText(item.risk_summary)}</p></article>)}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <ExpenseSignals uid={uid} />}</ProtectedPage>;
}
