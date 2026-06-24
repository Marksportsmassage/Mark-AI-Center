"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { createCfoBriefDraft } from "@/lib/cfoBrief";
import { getClientDb } from "@/lib/firebase/client";
import { buildReviewQueue } from "@/lib/reviewQueue";
import { buildTodayDashboardSummary, todayErrorMessage } from "@/lib/today";
import { formatDateTime } from "@/lib/ui/format";
import { displayText, safeJoin } from "@/lib/ui/safe";
import type {
  AuditLog,
  AccountBalance,
  CapitalAllocation,
  CreditCardObligation,
  DailyBrief,
  DecisionReport,
  ExpenseSignal,
  FinanceDecision,
  FinanceDecisionReview,
  FinanceReview,
  FinanceSnapshot,
  FinancialProfile,
  InvestmentDecision,
  Liability,
  TaskDispatch
} from "@/types/firestore";

function dateKey() {
  return new Date().toISOString().slice(0, 10);
}

function money(value: number) {
  return Number.isFinite(value) ? value.toLocaleString("zh-TW") : "0";
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><strong>{title}</strong>{items.length ? <ul>{items.slice(0, 20).map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul> : <p>{empty}</p>}</div>;
}

function TodayData({ uid }: { uid: string }) {
  const profiles = useFirestoreCollection<FinancialProfile>("financial_profile", recent20, true);
  const financeDecisions = useFirestoreCollection<FinanceDecision>("finance_decisions", recent20, true);
  const financeDecisionReviews = useFirestoreCollection<FinanceDecisionReview>("finance_decision_reviews", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const expenseSignals = useFirestoreCollection<ExpenseSignal>("expense_signals", recent20, true);
  const creditCards = useFirestoreCollection<CreditCardObligation>("credit_card_obligations", recent20, true);
  const tasks = useFirestoreCollection<TaskDispatch>("task_dispatches", recent20, true);
  const allocations = useFirestoreCollection<CapitalAllocation>("capital_allocations", recent20, true);
  const financeReviews = useFirestoreCollection<FinanceReview>("finance_reviews", recent20, true);
  const reports = useFirestoreCollection<DecisionReport>("decision_reports", recent20, true);
  const briefs = useFirestoreCollection<DailyBrief>("daily_briefs", recent20, true);
  const audits = useFirestoreCollection<AuditLog>("audit_logs", recent20, true);
  const financeSnapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const accountBalances = useFirestoreCollection<AccountBalance>("account_balances", recent20, true);
  const liabilities = useFirestoreCollection<Liability>("liabilities", recent20, true);
  const sources = [profiles, financeDecisions, financeDecisionReviews, investments, expenseSignals, creditCards, tasks, allocations, financeReviews, reports, briefs, audits, financeSnapshots, accountBalances, liabilities];
  const isLoading = sources.some((source) => source.isLoading);
  const error = todayErrorMessage(sources.map((source) => source.error));
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const reviewQueueItems = useMemo(() => {
    const reviewedDecisionIds = new Set(financeDecisionReviews.items.map((item) => item.finance_decision_id).filter(Boolean));
    return buildReviewQueue({
      task_dispatches: tasks.items as never[],
      finance_decisions: financeDecisions.items.map((item) => ({ ...item, review_id: reviewedDecisionIds.has(item.id) ? item.id : null })) as never[],
      finance_decision_reviews: financeDecisionReviews.items as never[],
      investment_decisions: investments.items as never[],
      capital_allocations: allocations.items as never[],
      finance_reviews: financeReviews.items as never[],
      decision_reports: reports.items as never[],
      credit_card_obligations: creditCards.items as never[]
    }, { sort: "risk" });
  }, [allocations.items, creditCards.items, financeDecisionReviews.items, financeDecisions.items, financeReviews.items, investments.items, reports.items, tasks.items]);

  const summary = useMemo(() => buildTodayDashboardSummary({
    financialProfile: profiles.items[0] ?? null,
    financeDecisions: financeDecisions.items,
    financeDecisionReviews: financeDecisionReviews.items,
    investmentDecisions: investments.items,
    expenseSignals: expenseSignals.items,
    creditCardObligations: creditCards.items,
    reviewQueueItems,
    taskDispatches: tasks.items,
    capitalAllocations: allocations.items,
    financeReviews: financeReviews.items,
    decisionReports: reports.items,
    dailyBriefs: briefs.items,
    auditLogs: audits.items,
    financeSnapshots: financeSnapshots.items,
    accountBalances: accountBalances.items,
    liabilities: liabilities.items
  }), [accountBalances.items, allocations.items, audits.items, briefs.items, creditCards.items, expenseSignals.items, financeDecisionReviews.items, financeDecisions.items, financeReviews.items, financeSnapshots.items, investments.items, liabilities.items, profiles.items, reports.items, reviewQueueItems, tasks.items]);

  async function createBrief() {
    setBusy(true);
    setCreateError(null);
    try {
      const result = await createCfoBriefDraft(getClientDb(), {
        userId: uid,
        dateKey: dateKey(),
        financialProfile: profiles.items[0] ?? null,
        financeDecisions: financeDecisions.items,
        financeDecisionReviews: financeDecisionReviews.items,
        investmentDecisions: investments.items,
        expenseSignals: expenseSignals.items,
        creditCardObligations: creditCards.items,
        reviewQueueItems,
        taskDispatches: tasks.items,
        capitalAllocations: allocations.items,
        financeReviews: financeReviews.items,
        decisionReports: reports.items,
        dailyBriefs: briefs.items,
        auditLogs: audits.items,
        financeSnapshots: financeSnapshots.items,
        accountBalances: accountBalances.items,
        liabilities: liabilities.items
      });
      setCreatedId(result.briefId);
    } catch (briefError) {
      setCreateError(briefError instanceof Error ? briefError.message : "Failed to create CFO brief draft.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>Today Operating Dashboard</h1>
          <p>今天要看、要決策、不能做、要補資料，集中在這一頁。</p>
        </div>
        <div className="action-row">
          <button className="button compact" disabled={busy || isLoading} type="button" onClick={createBrief}>產生今日 CFO Brief Draft</button>
          <Link className="button secondary compact" href="/command-center">Command Center</Link>
        </div>
      </header>

      {isLoading ? <section className="panel"><p className="muted">Loading today dashboard...</p></section> : null}
      {error ? <section className="panel"><h2>Today dashboard 讀取失敗</h2><p className="muted">{error}</p></section> : null}
      {createError ? <section className="panel"><h2>CFO Brief 建立失敗</h2><p className="muted">{createError}</p></section> : null}
      {createdId ? <section className="panel"><h2>CFO Brief Draft 已建立</h2><p>created id: <Link className="mono" href={`/daily-briefs/${createdId}`}>{createdId}</Link></p><p className="muted">下一步：到 Review Queue 審核。此動作沒有 LINE、push、email、OpenAI 或任何外部行動。</p></section> : null}

      <section className="stats-grid">
        <div className="stat"><strong>{summary.total_waiting_review}</strong><span className="muted">待審核總數</span></div>
        <div className="stat"><strong>{summary.high_risk_count}</strong><span className="muted">高風險項目</span></div>
        <div className="stat"><strong>{summary.missing_info_count}</strong><span className="muted">需要補資料</span></div>
        <div className="stat"><strong>{summary.financial_profile_complete ? "完整" : "待補"}</strong><span className="muted">財務資料</span></div>
      </section>

      <section className="panel">
        <h2>今日狀態摘要</h2>
        <div className="detail-grid">
          <div><strong>本月 expense signal 狀態</strong><p>{summary.expense_signal_status}</p></div>
          <div><strong>財務基準摘要</strong><p>net worth {money(financeSnapshots.items[0]?.net_worth ?? 0)} / account {accountBalances.items.length} / liabilities {liabilities.items.length}</p></div>
          <div><strong>最近一次 CFO brief 時間</strong><p>{formatDateTime(summary.latest_cfo_brief_at)}</p></div>
          <div><strong>最近 audit logs</strong><p>{audits.items.slice(0, 3).map((item) => item.action).join("、") || "尚無紀錄"}</p></div>
        </div>
      </section>

      <section className="panel">
        <h2>今天最重要 3 件事</h2>
        {summary.top_three.length ? <ol>{summary.top_three.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ol> : <p className="muted">目前沒有需要立刻處理的項目。可以先到 Intake 新增資料，或到 Finance Advisor 補財務基本資料。</p>}
      </section>

      <section className="panel">
        <h2>今日不建議做</h2>
        <ul>{summary.do_not_do_today.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="panel">
        <h2>可以先做且不花錢</h2>
        <div className="action-row">{summary.no_cost_next_actions.map((item) => <span className="badge" key={item}>{item}</span>)}</div>
      </section>

      <section className="panel">
        <h2>財務風險雷達</h2>
        <div className="stat-grid">
          <div className="stat-card"><strong>本月警訊支出</strong><span>{money(summary.finance_radar.total_warning_spending)}</span></div>
          <div className="stat-card"><strong>資產型支出</strong><span>{money(summary.finance_radar.total_asset_purchase)}</span></div>
          <div className="stat-card"><strong>投資型支出</strong><span>{money(summary.finance_radar.total_investment_related)}</span></div>
          <div className="stat-card"><strong>創業測試支出</strong><span>{money(summary.finance_radar.total_startup_test)}</span></div>
          <div className="stat-card"><strong>信用卡 / 分期月壓力</strong><span>{money(summary.finance_radar.credit_card_installment_pressure)}</span></div>
          <div className="stat-card"><strong>安全現金水位</strong><span>{summary.finance_radar.safety_cash_missing ? "待補" : "已讀取"}</span></div>
        </div>
        <p className="muted">觸發的風險規則：{safeJoin(summary.finance_radar.triggered_rules, "、", "目前沒有觸發規則")}</p>
      </section>

      <section className="panel">
        <h2>投資決策提醒</h2>
        {summary.investment_reminders.length ? <ul>{summary.investment_reminders.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">目前沒有投資決策提醒。</p>}
      </section>

      <section className="panel">
        <h2>Review Queue Snapshot</h2>
        <div className="list">{reviewQueueItems.slice(0, 10).map((item) => <article className="item" key={`${item.collection}-${item.id}`}><div className="item-header"><h3>{item.title}</h3><span className="badge review">{displayText(item.risk_level)}</span></div><p>{item.recommendation}</p><Link className="button secondary compact" href={item.href}>前往詳情</Link></article>)}{reviewQueueItems.length === 0 ? <p className="muted">目前沒有待審核項目。可以先到 Intake 新增資料，或到 Finance Advisor 補財務基本資料。</p> : null}</div>
      </section>

      <section className="panel">
        <h2>快速入口</h2>
        <div className="action-row">
          <Link className="button compact" href="/intake">前往 /intake</Link>
          <Link className="button compact" href="/review-queue">前往 /review-queue</Link>
          <Link className="button secondary compact" href="/finance-advisor">前往 /finance-advisor</Link>
          <Link className="button secondary compact" href="/finance-decisions">前往 /finance-decisions</Link>
          <Link className="button secondary compact" href="/investment-decisions">前往 /investment-decisions</Link>
          <Link className="button secondary compact" href="/expense-signals">前往 /expense-signals</Link>
          <Link className="button secondary compact" href="/audit-logs">前往 /audit-logs</Link>
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return <ProtectedPage>{(uid) => <TodayData uid={uid} />}</ProtectedPage>;
}
