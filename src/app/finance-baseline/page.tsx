"use client";

import Link from "next/link";
import { useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { createFinanceBaselineDraft } from "@/lib/financeBaseline";
import { getClientDb } from "@/lib/firebase/client";
import { formatDateTime } from "@/lib/ui/format";
import { displayText, safeJoin } from "@/lib/ui/safe";
import type { AccountBalance, FinanceSnapshot, FinancialProfile, Liability } from "@/types/firestore";

function money(value: unknown) {
  return typeof value === "number" ? value.toLocaleString("zh-TW") : "需要 Mark 補資料";
}

function FinanceBaselineData({ uid }: { uid: string }) {
  const snapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const accounts = useFirestoreCollection<AccountBalance>("account_balances", recent20, true);
  const liabilities = useFirestoreCollection<Liability>("liabilities", recent20, true);
  const profiles = useFirestoreCollection<FinancialProfile>("financial_profile", recent20, true);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const latest = snapshots.items[0] ?? null;
  const error = snapshots.error ?? accounts.error ?? liabilities.error ?? profiles.error;
  const loading = snapshots.isLoading || accounts.isLoading || liabilities.isLoading || profiles.isLoading;

  async function createSnapshot() {
    setBusy(true);
    try {
      const result = await createFinanceBaselineDraft(getClientDb(), {
        userId: uid,
        snapshotDate: new Date().toISOString().slice(0, 10),
        monthKey: new Date().toISOString().slice(0, 7),
        accountBalances: accounts.items,
        liabilities: liabilities.items,
        financialProfile: profiles.items[0] ?? null
      });
      setCreatedId(result.snapshotId);
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid"><header className="page-header"><div><h1>財務基準總表</h1><p>資產、負債、安全現金水位與可投入資金的 review-gated baseline。</p></div><div className="action-row"><button className="button compact" disabled={busy || loading} onClick={createSnapshot}>建立 / 更新 finance snapshot draft</button><Link className="button secondary compact" href="/today">Today Dashboard</Link><Link className="button secondary compact" href="/intake">Intake</Link></div></header>{error ? <section className="panel"><h2>Finance baseline error</h2><p className="muted">{error} 如果是 index 缺失，請依 Firebase 提示建立 index。</p></section> : null}{loading ? <p className="muted">Loading finance baseline...</p> : null}{createdId ? <section className="panel"><p>已建立 finance snapshot draft: <span className="mono">{createdId}</span></p></section> : null}<section className="panel"><h2>最新 Finance Snapshot</h2>{latest ? <div className="detail-grid"><div><strong>snapshot_date</strong><p>{latest.snapshot_date}</p></div><div><strong>net_worth</strong><p>{money(latest.net_worth)}</p></div><div><strong>total_assets</strong><p>{money(latest.total_assets)}</p></div><div><strong>total_liabilities</strong><p>{money(latest.total_liabilities)}</p></div><div><strong>安全現金水位</strong><p>{money(latest.safety_cash_reserve_target)}</p></div><div><strong>可投入資金</strong><p>{money(latest.available_cash_after_reserve)}</p></div><div><strong>risk_level</strong><p>{latest.risk_level}</p></div><div><strong>created_at</strong><p>{formatDateTime(latest.created_at)}</p></div></div> : <p className="muted">尚未建立 finance snapshot。可先從 Intake batch 或本頁建立草稿。</p>}<p className="muted">missing_required_fields: {safeJoin(latest?.missing_required_fields, "、", "None")}</p></section><section className="panel"><h2>Account Balances</h2><div className="list">{accounts.items.length ? accounts.items.map((item) => <article className="item" key={item.id}><div className="item-header"><h3>{displayText(item.account_name, "帳戶")}</h3><span className="badge">{item.account_type}</span></div><p>{money(item.balance)} {displayText(item.currency, "TWD")}</p></article>) : <p className="muted">尚未建立 account_balances。</p>}</div></section><section className="panel"><h2>Liabilities</h2><div className="list">{liabilities.items.length ? liabilities.items.map((item) => <article className="item" key={item.id}><div className="item-header"><h3>{displayText(item.lender_name, "負債")}</h3><span className="badge review">{item.risk_level}</span></div><p>餘額 {money(item.current_balance)} / 月壓力 {money(item.monthly_cashflow_impact)}</p></article>) : <p className="muted">尚未建立 liabilities。</p>}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <FinanceBaselineData uid={uid} />}</ProtectedPage>;
}
