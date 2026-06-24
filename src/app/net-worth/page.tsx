"use client";

import Link from "next/link";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import type { AccountBalance, Liability } from "@/types/firestore";

function sum(values: Array<number | null | undefined>) {
  return values.reduce<number>((total, value) => total + (typeof value === "number" ? value : 0), 0);
}

function money(value: number) {
  return value.toLocaleString("zh-TW");
}

function NetWorthData() {
  const accounts = useFirestoreCollection<AccountBalance>("account_balances", recent20, true);
  const liabilities = useFirestoreCollection<Liability>("liabilities", recent20, true);
  const totalAssets = sum(accounts.items.map((item) => item.balance));
  const totalLiabilities = sum(liabilities.items.map((item) => item.current_balance));
  const netWorth = totalAssets - totalLiabilities;
  const grouped = ["cash", "bank", "brokerage", "gold", "crypto", "other"].map((type) => ({ type, total: sum(accounts.items.filter((item) => item.account_type === type).map((item) => item.balance)) }));
  const liabilityGrouped = ["credit_card", "installment", "car_loan", "student_loan", "personal_loan", "other"].map((type) => ({ type, total: sum(liabilities.items.filter((item) => item.liability_type === type).map((item) => item.current_balance)) }));
  const error = accounts.error ?? liabilities.error;
  return <div className="grid"><header className="page-header"><div><h1>資產負債表</h1><p>不抓即時價格；市值缺失會列為待補資料。</p></div><div className="action-row"><Link className="button secondary compact" href="/finance-baseline">財務基準總表</Link><Link className="button secondary compact" href="/today">Today</Link></div></header>{error ? <section className="panel"><p className="muted">{error}</p></section> : null}<section className="stats-grid"><div className="stat"><strong>{money(totalAssets)}</strong><span className="muted">總資產</span></div><div className="stat"><strong>{money(totalLiabilities)}</strong><span className="muted">總負債</span></div><div className="stat"><strong>{money(netWorth)}</strong><span className="muted">淨資產</span></div><div className="stat"><strong>{accounts.items.filter((item) => item.balance === null || item.balance === undefined).length}</strong><span className="muted">缺市值資料</span></div></section><section className="panel"><h2>資產配置比例</h2><div className="detail-grid">{grouped.map((item) => <div key={item.type}><strong>{item.type}</strong><p>{money(item.total)} / {totalAssets ? Math.round(item.total / totalAssets * 100) : 0}%</p></div>)}</div></section><section className="panel"><h2>負債</h2><div className="detail-grid">{liabilityGrouped.map((item) => <div key={item.type}><strong>{item.type}</strong><p>{money(item.total)}</p></div>)}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{() => <NetWorthData />}</ProtectedPage>;
}
