"use client";

import Link from "next/link";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { buildReviewQueue, queueMissingText, reviewQueueGroups } from "@/lib/reviewQueue";
import { formatDateTime } from "@/lib/ui/format";
import type {
  CapitalAllocation,
  CodexJob,
  CreditCardObligation,
  DecisionReport,
  FinanceDecision,
  FinanceDecisionReview,
  FinanceReview,
  InvestmentDecision,
  KnowledgeSop,
  TaskDispatch
} from "@/types/firestore";

function ReviewQueueData() {
  const tasks = useFirestoreCollection<TaskDispatch>("task_dispatches", recent20, true);
  const financeDecisions = useFirestoreCollection<FinanceDecision>("finance_decisions", recent20, true);
  const financeDecisionReviews = useFirestoreCollection<FinanceDecisionReview>("finance_decision_reviews", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const allocations = useFirestoreCollection<CapitalAllocation>("capital_allocations", recent20, true);
  const financeReviews = useFirestoreCollection<FinanceReview>("finance_reviews", recent20, true);
  const reports = useFirestoreCollection<DecisionReport>("decision_reports", recent20, true);
  const jobs = useFirestoreCollection<CodexJob>("codex_jobs", recent20, true);
  const sops = useFirestoreCollection<KnowledgeSop>("knowledge_sop", recent20, true);
  const creditCards = useFirestoreCollection<CreditCardObligation>("credit_card_obligations", recent20, true);
  const sources = [tasks, financeDecisions, financeDecisionReviews, investments, allocations, financeReviews, reports, jobs, sops, creditCards];
  const error = sources.map((source) => source.error).find(Boolean);
  const isLoading = sources.some((source) => source.isLoading);
  const queue = buildReviewQueue({
    task_dispatches: tasks.items as never[],
    finance_decisions: financeDecisions.items as never[],
    finance_decision_reviews: financeDecisionReviews.items as never[],
    investment_decisions: investments.items as never[],
    capital_allocations: allocations.items as never[],
    finance_reviews: financeReviews.items as never[],
    decision_reports: reports.items as never[],
    codex_jobs: jobs.items as never[],
    knowledge_sop: sops.items as never[],
    credit_card_obligations: creditCards.items as never[]
  });

  return <div className="grid"><header className="page-header"><div><h1>Mark Review Queue</h1><p>所有需要 Mark review 或補資料的草稿集中在這裡。</p></div><div className="action-row"><Link className="button compact" href="/intake">AI 資料輸入中心</Link><Link className="button secondary compact" href="/command-center">Command Center</Link></div></header>{error ? <section className="panel"><h2>Review Queue 讀取失敗</h2><p className="muted">{error} 如果是 Firestore index 問題，請先回報錯誤，不要重複操作。</p></section> : null}{isLoading ? <p className="muted">Loading review queue...</p> : null}{queue.length === 0 && !isLoading ? <section className="panel"><p className="muted">目前沒有待審核項目</p></section> : null}{reviewQueueGroups.map((group) => { const items = queue.filter((item) => item.group === group); if (!items.length) return null; return <section className="panel" key={group}><h2>{group}</h2><div className="list">{items.map((item) => <article className="item" key={`${item.collection}-${item.id}`}><div className="item-header"><h3>{item.title}</h3><span className="badge review">{item.status}</span></div><div className="detail-grid"><div><strong>collection type</strong><p>{item.collection}</p></div><div><strong>risk level</strong><p>{item.risk_level}</p></div><div><strong>created_at</strong><p>{formatDateTime(item.created_at)}</p></div><div><strong>missing_required_fields</strong><p>{queueMissingText(item)}</p></div></div><Link className="button secondary compact" href={item.href}>查看詳情</Link></article>)}</div></section>; })}</div>;
}

export default function Page() {
  return <ProtectedPage>{() => <ReviewQueueData />}</ProtectedPage>;
}
