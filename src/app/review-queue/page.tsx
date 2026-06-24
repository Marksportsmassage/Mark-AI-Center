"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { createCfoBriefDraft } from "@/lib/cfoBrief";
import { getClientDb } from "@/lib/firebase/client";
import { buildReviewQueue, queueMissingText, reviewQueueGroups, type ReviewQueueFilter, type ReviewQueueSort } from "@/lib/reviewQueue";
import { formatDateTime } from "@/lib/ui/format";
import type {
  AdvisorActionDraft,
  AdvisorMessage,
  AdvisorThread,
  BusinessExperiment,
  CapitalAllocation,
  ClientProfile,
  ClientSession,
  ContentDraft,
  ContentIdea,
  CodexJob,
  CreditCardObligation,
  DailyBrief,
  DecisionReport,
  DecisionScenario,
  DecisionFollowup,
  ExpenseSignal,
  AccountBalance,
  FinanceDecision,
  FinanceDecisionReview,
  FinanceReview,
  FinanceSnapshot,
  FinancialProfile,
  InvestmentDecision,
  Liability,
  ProductFeature,
  MonthlyClose,
  RecoveryPlan,
  RoadmapItem,
  StartupTestPlan,
  StudyNote,
  WeeklyReview,
  KnowledgeSop,
  TaskDispatch
} from "@/types/firestore";

function dateKey() {
  return new Date().toISOString().slice(0, 10);
}

function ReviewQueueData({ uid }: { uid: string }) {
  const [filter, setFilter] = useState<ReviewQueueFilter>("all");
  const [sort, setSort] = useState<ReviewQueueSort>("risk");
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const tasks = useFirestoreCollection<TaskDispatch>("task_dispatches", recent20, true);
  const advisorThreads = useFirestoreCollection<AdvisorThread>("advisor_threads", recent20, true);
  const advisorMessages = useFirestoreCollection<AdvisorMessage>("advisor_messages", recent20, true);
  const advisorActionDrafts = useFirestoreCollection<AdvisorActionDraft>("advisor_action_drafts", recent20, true);
  const clientProfiles = useFirestoreCollection<ClientProfile>("client_profiles", recent20, true);
  const clientSessions = useFirestoreCollection<ClientSession>("client_sessions", recent20, true);
  const contentIdeas = useFirestoreCollection<ContentIdea>("content_ideas", recent20, true);
  const contentDrafts = useFirestoreCollection<ContentDraft>("content_drafts", recent20, true);
  const studyNotes = useFirestoreCollection<StudyNote>("study_notes", recent20, true);
  const businessExperiments = useFirestoreCollection<BusinessExperiment>("business_experiments", recent20, true);
  const startupPlans = useFirestoreCollection<StartupTestPlan>("startup_test_plans", recent20, true);
  const productFeatures = useFirestoreCollection<ProductFeature>("product_features", recent20, true);
  const roadmapItems = useFirestoreCollection<RoadmapItem>("roadmap_items", recent20, true);
  const financeDecisions = useFirestoreCollection<FinanceDecision>("finance_decisions", recent20, true);
  const financeDecisionReviews = useFirestoreCollection<FinanceDecisionReview>("finance_decision_reviews", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const allocations = useFirestoreCollection<CapitalAllocation>("capital_allocations", recent20, true);
  const financeReviews = useFirestoreCollection<FinanceReview>("finance_reviews", recent20, true);
  const reports = useFirestoreCollection<DecisionReport>("decision_reports", recent20, true);
  const jobs = useFirestoreCollection<CodexJob>("codex_jobs", recent20, true);
  const sops = useFirestoreCollection<KnowledgeSop>("knowledge_sop", recent20, true);
  const creditCards = useFirestoreCollection<CreditCardObligation>("credit_card_obligations", recent20, true);
  const profiles = useFirestoreCollection<FinancialProfile>("financial_profile", recent20, true);
  const expenseSignals = useFirestoreCollection<ExpenseSignal>("expense_signals", recent20, true);
  const briefs = useFirestoreCollection<DailyBrief>("daily_briefs", recent20, true);
  const financeSnapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const accountBalances = useFirestoreCollection<AccountBalance>("account_balances", recent20, true);
  const liabilities = useFirestoreCollection<Liability>("liabilities", recent20, true);
  const scenarios = useFirestoreCollection<DecisionScenario>("decision_scenarios", recent20, true);
  const recoveryPlans = useFirestoreCollection<RecoveryPlan>("recovery_plans", recent20, true);
  const weeklyReviews = useFirestoreCollection<WeeklyReview>("weekly_reviews", recent20, true);
  const monthlyCloses = useFirestoreCollection<MonthlyClose>("monthly_closes", recent20, true);
  const followups = useFirestoreCollection<DecisionFollowup>("decision_followups", recent20, true);
  const sources = [tasks, advisorThreads, advisorMessages, advisorActionDrafts, clientProfiles, clientSessions, contentIdeas, contentDrafts, studyNotes, businessExperiments, startupPlans, productFeatures, roadmapItems, financeDecisions, financeDecisionReviews, investments, allocations, financeReviews, reports, jobs, sops, creditCards, profiles, expenseSignals, briefs, financeSnapshots, accountBalances, liabilities, scenarios, recoveryPlans, weeklyReviews, monthlyCloses, followups];
  const error = sources.map((source) => source.error).find(Boolean);
  const isLoading = sources.some((source) => source.isLoading);
  const queue = useMemo(() => {
    const reviewedDecisionIds = new Set(financeDecisionReviews.items.map((item) => item.finance_decision_id).filter(Boolean));
    return buildReviewQueue({
      task_dispatches: tasks.items as never[],
      advisor_threads: advisorThreads.items as never[],
      advisor_messages: advisorMessages.items as never[],
      advisor_action_drafts: advisorActionDrafts.items as never[],
      client_profiles: clientProfiles.items as never[],
      client_sessions: clientSessions.items as never[],
      content_ideas: contentIdeas.items as never[],
      content_drafts: contentDrafts.items as never[],
      study_notes: studyNotes.items as never[],
      business_experiments: businessExperiments.items as never[],
      startup_test_plans: startupPlans.items as never[],
      product_features: productFeatures.items as never[],
      roadmap_items: roadmapItems.items as never[],
      finance_decisions: financeDecisions.items.map((item) => ({ ...item, review_id: reviewedDecisionIds.has(item.id) ? item.id : null })) as never[],
      finance_decision_reviews: financeDecisionReviews.items as never[],
      investment_decisions: investments.items as never[],
      capital_allocations: allocations.items as never[],
      finance_reviews: financeReviews.items as never[],
      decision_reports: reports.items as never[],
      codex_jobs: jobs.items as never[],
      knowledge_sop: sops.items as never[],
      credit_card_obligations: creditCards.items as never[],
      finance_snapshots: financeSnapshots.items as never[],
      account_balances: accountBalances.items as never[],
      liabilities: liabilities.items as never[],
      decision_scenarios: scenarios.items as never[],
      recovery_plans: recoveryPlans.items as never[],
      weekly_reviews: weeklyReviews.items as never[],
      monthly_closes: monthlyCloses.items as never[],
      decision_followups: followups.items as never[]
    }, { filter, sort });
  }, [accountBalances.items, advisorActionDrafts.items, advisorMessages.items, advisorThreads.items, allocations.items, businessExperiments.items, clientProfiles.items, clientSessions.items, contentDrafts.items, contentIdeas.items, creditCards.items, financeDecisionReviews.items, financeDecisions.items, financeReviews.items, financeSnapshots.items, filter, followups.items, investments.items, jobs.items, liabilities.items, monthlyCloses.items, productFeatures.items, recoveryPlans.items, reports.items, roadmapItems.items, scenarios.items, sops.items, sort, startupPlans.items, studyNotes.items, tasks.items, weeklyReviews.items]);
  const filterOptions: Array<{ value: ReviewQueueFilter; label: string }> = [
    { value: "all", label: "全部" },
    { value: "high_risk", label: "高風險" },
    { value: "missing_info", label: "需要補資料" },
    { value: "finance", label: "財務決策" },
    { value: "investment", label: "投資決策" },
    { value: "credit", label: "信用卡 / 分期" },
    { value: "sop_codex", label: "SOP / Codex" },
    { value: "today", label: "已逾期或需要今日處理" }
  ];

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
        reviewQueueItems: queue,
        taskDispatches: tasks.items,
        capitalAllocations: allocations.items,
        financeReviews: financeReviews.items,
        decisionReports: reports.items,
        dailyBriefs: briefs.items
      });
      setCreatedId(result.briefId);
    } catch (briefError) {
      setCreateError(briefError instanceof Error ? briefError.message : "Failed to create CFO brief draft.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid"><header className="page-header"><div><h1>Mark Review Queue</h1><p>所有需要 Mark review 或補資料的草稿集中在這裡。</p></div><div className="action-row"><Link className="button compact" href="/today">回 Today Dashboard</Link><button className="button compact" type="button" disabled={busy || isLoading} onClick={createBrief}>產生今日 CFO Brief Draft</button><Link className="button secondary compact" href="/intake">前往 Intake</Link><Link className="button secondary compact" href="/command-center">Command Center</Link></div></header>{error ? <section className="panel"><h2>Review Queue 讀取失敗</h2><p className="muted">{error} 如果是 Firestore index 問題，請先回報錯誤，不要重複操作。</p></section> : null}{createError ? <section className="panel"><h2>CFO Brief 建立失敗</h2><p className="muted">{createError}</p></section> : null}{createdId ? <section className="panel"><h2>CFO Brief Draft 已建立</h2><p>created id: <Link className="mono" href={`/daily-briefs/${createdId}`}>{createdId}</Link></p></section> : null}<section className="panel"><h2>篩選與排序</h2><div className="action-row">{filterOptions.map((option) => <button className={`button compact ${filter === option.value ? "" : "secondary"}`} key={option.value} type="button" onClick={() => setFilter(option.value)}>{option.label}</button>)}</div><label>排序<select value={sort} onChange={(event) => setSort(event.target.value as ReviewQueueSort)}><option value="risk">risk first</option><option value="newest">newest first</option><option value="missing">missing info first</option></select></label></section>{isLoading ? <p className="muted">Loading review queue...</p> : null}{queue.length === 0 && !isLoading ? <section className="panel"><p className="muted">目前沒有待審核項目。可以先到 Intake 新增資料，或到 Finance Advisor 補財務基本資料。</p><div className="action-row"><Link className="button compact" href="/intake">前往 Intake</Link><Link className="button secondary compact" href="/finance-advisor">前往 Finance Advisor</Link></div></section> : null}{reviewQueueGroups.map((group) => { const items = queue.filter((item) => item.group === group); if (!items.length) return null; return <section className="panel" key={group}><h2>{group}</h2><div className="list">{items.map((item) => <article className="item" key={`${item.collection}-${item.id}`}><div className="item-header"><h3>{item.title}</h3><span className="badge review">{item.status}</span></div><div className="detail-grid"><div><strong>collection type</strong><p>{item.collection}</p></div><div><strong>risk_level</strong><p>{item.risk_level}</p></div><div><strong>recommendation</strong><p>{item.recommendation}</p></div><div><strong>created_at</strong><p>{formatDateTime(item.created_at)}</p></div><div><strong>missing_required_fields</strong><p>{queueMissingText(item)}</p></div></div>{item.needs_review_draft ? <p className="muted">尚未產生分析，建議先產生 Review Draft</p> : null}<strong>next_actions</strong><ul>{item.next_actions.map((action) => <li key={action}>{action}</li>)}</ul><Link className="button secondary compact" href={item.href}>前往詳情</Link></article>)}</div></section>; })}</div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <ReviewQueueData uid={uid} />}</ProtectedPage>;
}
