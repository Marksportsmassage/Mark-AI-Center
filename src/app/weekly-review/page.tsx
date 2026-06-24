"use client";

import Link from "next/link";
import { useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { buildWeeklyReview, createWeeklyReviewDraft } from "@/lib/operatingCadence";
import { getClientDb } from "@/lib/firebase/client";
import { safeJoin } from "@/lib/ui/safe";
import type { DecisionFollowup, ExpenseSignal, FinanceDecision, InvestmentDecision, WeeklyReview } from "@/types/firestore";

function weekKey() {
  const now = new Date();
  return `${now.getFullYear()}-W${Math.ceil((now.getDate() + 6) / 7)}`;
}

function WeeklyReviewData({ uid }: { uid: string }) {
  const reviews = useFirestoreCollection<WeeklyReview>("weekly_reviews", recent20, true);
  const signals = useFirestoreCollection<ExpenseSignal>("expense_signals", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const decisions = useFirestoreCollection<FinanceDecision>("finance_decisions", recent20, true);
  const followups = useFirestoreCollection<DecisionFollowup>("decision_followups", recent20, true);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  async function create() {
    setBusy(true);
    try {
      const result = await createWeeklyReviewDraft(getClientDb(), buildWeeklyReview({ userId: uid, weekKey: weekKey(), expenseSignals: signals.items, investments: investments.items, financeDecisions: decisions.items, followups: followups.items }));
      setCreatedId(result.weeklyReviewId);
    } finally {
      setBusy(false);
    }
  }
  return <div className="grid"><header className="page-header"><div><h1>每週 CFO 回顧</h1><p>整理本週最高風險、警訊支出、投資待審核與下週不花錢可做事項。</p></div><div className="action-row"><button className="button compact" disabled={busy} onClick={create}>產生本週 review draft</button><Link className="button secondary compact" href="/today">Today</Link></div></header>{createdId ? <section className="panel"><p>已建立 weekly review: <span className="mono">{createdId}</span></p></section> : null}<section className="panel"><h2>Weekly Reviews</h2><div className="list">{reviews.items.length ? reviews.items.map((item) => <article className="item" key={item.id}><h3>{item.week_key}</h3><p>{item.summary}</p><p>top risks: {safeJoin(item.top_risks)}</p></article>) : <p className="muted">尚未建立 weekly reviews。</p>}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <WeeklyReviewData uid={uid} />}</ProtectedPage>;
}
