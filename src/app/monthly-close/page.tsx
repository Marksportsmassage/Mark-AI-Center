"use client";

import Link from "next/link";
import { useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { buildMonthlyClose, createMonthlyCloseDraft } from "@/lib/operatingCadence";
import { getClientDb } from "@/lib/firebase/client";
import type { CreditCardObligation, ExpenseSignal, FinanceSnapshot, InvestmentDecision, MonthlyClose } from "@/types/firestore";

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function MonthlyCloseData({ uid }: { uid: string }) {
  const closes = useFirestoreCollection<MonthlyClose>("monthly_closes", recent20, true);
  const snapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const signals = useFirestoreCollection<ExpenseSignal>("expense_signals", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const cards = useFirestoreCollection<CreditCardObligation>("credit_card_obligations", recent20, true);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  async function create() {
    setBusy(true);
    try {
      const result = await createMonthlyCloseDraft(getClientDb(), buildMonthlyClose({ userId: uid, monthKey: monthKey(), snapshot: snapshots.items[0] ?? null, expenseSignals: signals.items, investments: investments.items, creditCards: cards.items }));
      setCreatedId(result.monthlyCloseId);
    } finally {
      setBusy(false);
    }
  }
  return <div className="grid"><header className="page-header"><div><h1>每月財務結算</h1><p>月底淨資產、支出總結、投資變化、負債變化與下月計畫。不做外部動作。</p></div><div className="action-row"><button className="button compact" disabled={busy} onClick={create}>產生本月 close draft</button><Link className="button secondary compact" href="/today">Today</Link></div></header>{createdId ? <section className="panel"><p>已建立 monthly close: <span className="mono">{createdId}</span></p></section> : null}<section className="panel"><h2>Monthly Closes</h2><div className="list">{closes.items.length ? closes.items.map((item) => <article className="item" key={item.id}><h3>{item.month_key}</h3><p>{item.cashflow_result}</p><p>{item.expense_summary}</p></article>) : <p className="muted">尚未建立 monthly closes。</p>}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <MonthlyCloseData uid={uid} />}</ProtectedPage>;
}
