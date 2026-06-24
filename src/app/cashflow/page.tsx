"use client";

import Link from "next/link";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import type { FinancialProfile, Liability } from "@/types/firestore";

function money(value: unknown) {
  return typeof value === "number" ? value.toLocaleString("zh-TW") : "需要 Mark 補資料";
}

function CashflowData() {
  const profiles = useFirestoreCollection<FinancialProfile>("financial_profile", recent20, true);
  const liabilities = useFirestoreCollection<Liability>("liabilities", recent20, true);
  const profile = profiles.items[0] ?? null;
  const debtPayment = liabilities.items.reduce((total, item) => total + (item.monthly_cashflow_impact ?? item.monthly_payment ?? 0), 0);
  const income = profile?.monthly_income_estimate ?? null;
  const fixed = profile?.monthly_fixed_costs ?? profile?.monthly_living_expense ?? null;
  const remaining = typeof income === "number" && typeof fixed === "number" ? income - fixed - debtPayment : null;
  const safetyMonths = typeof profile?.safety_cash_reserve_target === "number" && typeof fixed === "number" && fixed > 0 ? profile.safety_cash_reserve_target / fixed : null;
  const error = profiles.error ?? liabilities.error;
  return <div className="grid"><header className="page-header"><div><h1>每月現金流</h1><p>收入、固定支出、變動估計與負債月付。只顯示，不自動扣款或付款。</p></div><div className="action-row"><Link className="button secondary compact" href="/finance-baseline">財務基準總表</Link><Link className="button secondary compact" href="/today">Today</Link></div></header>{error ? <section className="panel"><p className="muted">{error}</p></section> : null}<section className="stats-grid"><div className="stat"><strong>{money(income)}</strong><span className="muted">每月收入估計</span></div><div className="stat"><strong>{money(fixed)}</strong><span className="muted">固定支出 / 生活費</span></div><div className="stat"><strong>{money(debtPayment)}</strong><span className="muted">貸款 / 信用卡 / 分期月付</span></div><div className="stat"><strong>{money(remaining)}</strong><span className="muted">剩餘現金流</span></div></section><section className="panel"><h2>安全現金月數</h2><p className="muted">{typeof safetyMonths === "number" ? `${safetyMonths.toFixed(1)} 個月` : "需要補安全現金水位與每月固定支出。"}</p></section><section className="panel"><h2>風險提醒</h2><ul><li>信用卡繳費是負債償還，不 double count 為新消費。</li><li>分期會計入 monthly cashflow impact。</li><li>不自動扣款、不自動付款。</li></ul></section></div>;
}

export default function Page() {
  return <ProtectedPage>{() => <CashflowData />}</ProtectedPage>;
}
