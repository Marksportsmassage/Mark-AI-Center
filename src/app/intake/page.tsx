"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import {
  createFinancialProfileDraftFromIntake,
  createInvestmentDraftFromIntake,
  createProjectDecisionDraftFromIntake,
  createSpendingDraftFromIntake,
  type IntakeResult
} from "@/lib/intake";
import { parseNullableNumber } from "@/lib/financeReviewActions";

function ResultPanel({ results }: { results: IntakeResult[] }) {
  if (!results.length) return null;
  return <section className="panel"><h2>建立後結果</h2><div className="list">{results.map((result) => <article className="item" key={`${result.collection}-${result.id}`}><div className="item-header"><h3>{result.kind}</h3><span className="badge review">{result.collection}</span></div><p>doc id: <span className="mono">{result.id}</span></p><div className="action-row"><Link className="button compact" href={result.href}>前往詳情</Link><Link className="button secondary compact" href="/review-queue">到 Review Queue 審核</Link><Link className="button secondary compact" href="/audit-logs">查看 Audit Logs</Link></div><ul>{result.next_actions.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></section>;
}

function IntakeData({ uid }: { uid: string }) {
  const [results, setResults] = useState<IntakeResult[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run<T extends HTMLFormElement>(event: FormEvent<T>, kind: string, action: (form: FormData) => Promise<IntakeResult[]>) {
    event.preventDefault();
    setBusy(kind);
    setError(null);
    try {
      const next = await action(new FormData(event.currentTarget));
      setResults(next);
      event.currentTarget.reset();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Intake failed.");
    } finally {
      setBusy(null);
    }
  }

  return <div className="grid"><header className="page-header"><div><h1>AI 資料輸入中心</h1><p>貼上財務資料、支出、信用卡、分期、投資或創業想法，先建立 review-gated draft。</p></div><div className="action-row"><Link className="button secondary compact" href="/review-queue">Mark Review Queue</Link><Link className="button secondary compact" href="/command-center">Command Center</Link></div></header>{error ? <section className="panel"><h2>Intake error</h2><p className="muted">{error}</p></section> : null}<ResultPanel results={results} /><section className="panel"><h2>財務基本資料輸入</h2><p className="muted">貼上銀行帳戶、現金、股票總額、信用卡、分期、每月固定支出，我會先建立財務基準草稿，不會自動做任何投資或支出決策。</p><form className="grid" onSubmit={(event) => run(event, "snapshot", async (form) => [await createFinancialProfileDraftFromIntake(getClientDb(), uid, String(form.get("raw_financial_snapshot_text") ?? ""), String(form.get("month_key") ?? ""), String(form.get("notes") ?? ""))])}><label>raw_financial_snapshot_text<textarea name="raw_financial_snapshot_text" rows={5} required /></label><div className="detail-grid"><label>month_key<input name="month_key" placeholder="2026-06" /></label><label>notes<input name="notes" placeholder="補充說明" /></label></div><button className="button compact" disabled={Boolean(busy)}>建立財務基本資料草稿</button></form></section><section className="panel"><h2>重大支出 / Line Pay / 信用卡 / 分期輸入</h2><p className="muted">只輸入你覺得大筆或有警訊的支出，不需要逐筆記帳。</p><form className="grid" onSubmit={(event) => run(event, "spending", async (form) => createSpendingDraftFromIntake(getClientDb(), uid, String(form.get("raw_spending_text") ?? ""), { amount: parseNullableNumber(form.get("amount")), payment_method: String(form.get("payment_method") ?? "") || null, occurred_at: String(form.get("occurred_at") ?? "") || null, category: String(form.get("category") ?? "") || null }))}><label>raw_spending_text<textarea name="raw_spending_text" rows={4} required /></label><div className="detail-grid"><label>amount<input name="amount" type="number" min="0" step="1" /></label><label>payment_method<input name="payment_method" placeholder="Line Pay / credit_card" /></label><label>occurred_at<input name="occurred_at" type="date" /></label><label>category<input name="category" placeholder="course / equipment / bill" /></label></div><button className="button compact" disabled={Boolean(busy)}>建立重大財務決策草稿</button></form></section><section className="panel"><h2>投資 / 股票決策輸入</h2><p className="muted">貼上股票、ETF、黃金、比特幣、美股等投資決策。系統只產生決策草稿，不會下單。</p><form className="grid" onSubmit={(event) => run(event, "investment", async (form) => [await createInvestmentDraftFromIntake(getClientDb(), uid, String(form.get("raw_investment_text") ?? ""), { symbol: String(form.get("symbol") ?? "") || null, market: String(form.get("market") ?? "") || null, position_type: (String(form.get("position_type") ?? "") || "review") as never, cost_basis: parseNullableNumber(form.get("cost_basis")), current_price: parseNullableNumber(form.get("current_price")), quantity: parseNullableNumber(form.get("quantity")), original_thesis: String(form.get("original_thesis") ?? "") || null, time_horizon: (String(form.get("time_horizon") ?? "") || "medium") as never })])}><label>raw_investment_text<textarea name="raw_investment_text" rows={4} required /></label><div className="detail-grid"><label>symbol<input name="symbol" placeholder="2330 / AAPL" /></label><label>market<input name="market" placeholder="TW / US" /></label><label>position_type<input name="position_type" placeholder="new_buy / add / reduce / sell / hold / review" /></label><label>cost_basis<input name="cost_basis" type="number" min="0" step="0.01" /></label><label>current_price<input name="current_price" type="number" min="0" step="0.01" /></label><label>quantity<input name="quantity" type="number" min="0" step="1" /></label><label>original_thesis<input name="original_thesis" placeholder="原始買進理由" /></label><label>time_horizon<input name="time_horizon" placeholder="short / medium / long" /></label></div><button className="button compact" disabled={Boolean(busy)}>建立投資決策草稿</button></form></section><section className="panel"><h2>創業 / 專案 / 資產購買輸入</h2><p className="muted">貼上你想做的副業、購買器材、課程、工作室、選品、一番賞、飲料店、App 等想法。</p><form className="grid" onSubmit={(event) => run(event, "project", async (form) => [await createProjectDecisionDraftFromIntake(getClientDb(), uid, String(form.get("raw_project_decision_text") ?? ""), { related_project_id: String(form.get("related_project_id") ?? "") || null, amount: parseNullableNumber(form.get("amount")), notes: String(form.get("notes") ?? "") || null })])}><label>raw_project_decision_text<textarea name="raw_project_decision_text" rows={4} required /></label><div className="detail-grid"><label>related_project_id<input name="related_project_id" placeholder="startup_radar" /></label><label>amount<input name="amount" type="number" min="0" step="1" /></label><label>notes<input name="notes" /></label></div><button className="button compact" disabled={Boolean(busy)}>建立創業 / 資產決策草稿</button></form></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <IntakeData uid={uid} />}</ProtectedPage>;
}
