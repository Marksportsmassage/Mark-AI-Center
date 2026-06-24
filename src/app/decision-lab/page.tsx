"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { createDecisionScenarioDraft, simulateDecisionScenario } from "@/lib/decisionSimulator";
import { getClientDb } from "@/lib/firebase/client";
import { parseNullableNumber } from "@/lib/financeReviewActions";
import { displayText } from "@/lib/ui/safe";
import type { DecisionScenario, FinanceSnapshot } from "@/types/firestore";

function DecisionLabData({ uid }: { uid: string }) {
  const snapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const scenarios = useFirestoreCollection<DecisionScenario>("decision_scenarios", recent20, true);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const draft = simulateDecisionScenario({
        userId: uid,
        rawInput: String(form.get("raw_input") ?? ""),
        scenarioType: (String(form.get("scenario_type") ?? "spending") || "spending") as never,
        amount: parseNullableNumber(form.get("amount")),
        expectedReturn: parseNullableNumber(form.get("expected_return")),
        expectedSavings: parseNullableNumber(form.get("expected_savings")),
        expectedIncomeLift: parseNullableNumber(form.get("expected_income_lift")),
        timeHorizonMonths: parseNullableNumber(form.get("time_horizon_months")),
        snapshot: snapshots.items[0] ?? null
      });
      const result = await createDecisionScenarioDraft(getClientDb(), draft);
      setCreatedId(result.scenarioId);
      event.currentTarget.reset();
    } finally {
      setBusy(false);
    }
  }
  return <div className="grid"><header className="page-header"><div><h1>決策實驗室</h1><p>模擬花錢、投資、創業測試前的安全現金、月現金流與回本影響。不做外部動作。</p></div><div className="action-row"><Link className="button secondary compact" href="/capital-plan">資本配置計畫</Link><Link className="button secondary compact" href="/today">Today</Link></div></header>{snapshots.error || scenarios.error ? <section className="panel"><p className="muted">{snapshots.error ?? scenarios.error}</p></section> : null}<section className="panel"><h2>新增 decision scenario draft</h2><form className="grid" onSubmit={create}><label>raw_input<textarea name="raw_input" rows={4} required /></label><div className="detail-grid"><label>scenario_type<input name="scenario_type" placeholder="spending / investment / startup_test / asset_purchase / debt_payment" /></label><label>amount<input name="amount" type="number" min="0" /></label><label>time_horizon_months<input name="time_horizon_months" type="number" min="0" /></label><label>expected_return<input name="expected_return" type="number" min="0" /></label><label>expected_savings<input name="expected_savings" type="number" min="0" /></label><label>expected_income_lift<input name="expected_income_lift" type="number" min="0" /></label></div><button className="button compact" disabled={busy}>產生 decision scenario draft</button>{createdId ? <p className="muted">已建立：<span className="mono">{createdId}</span></p> : null}</form></section><section className="panel"><h2>Scenario List</h2><div className="list">{scenarios.items.length ? scenarios.items.map((item) => <article className="item" key={item.id}><div className="item-header"><h3>{displayText(item.title, "Scenario")}</h3><span className="badge review">{item.status}</span></div><div className="detail-grid"><div><strong>recommendation</strong><p>{item.recommendation}</p></div><div><strong>breakeven_months</strong><p>{displayText(item.breakeven_months)}</p></div><div><strong>safety_reserve_impact</strong><p>{item.safety_reserve_impact}</p></div><div><strong>worst_case_loss</strong><p>{displayText(item.worst_case_loss)}</p></div></div></article>) : <p className="muted">目前沒有 decision scenarios。</p>}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <DecisionLabData uid={uid} />}</ProtectedPage>;
}
