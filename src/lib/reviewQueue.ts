import { asArray, displayText, safeJoin } from "@/lib/ui/safe";

export interface ReviewQueueItem {
  id: string;
  title: string;
  collection: string;
  group: string;
  status: string;
  risk_level: string;
  risk_priority: number;
  recommendation: string;
  next_actions: string[];
  needs_review_draft: boolean;
  created_at: unknown;
  missing_required_fields: string[];
  href: string;
}

type AnyRecord = Record<string, unknown> & { id?: string };

const hrefs: Record<string, (id: string) => string> = {
  task_dispatches: (id) => `/task-dispatches/${id}`,
  advisor_threads: () => "/advisor-chat",
  advisor_messages: () => "/advisor-chat",
  advisor_action_drafts: () => "/advisor-chat",
  finance_decisions: (id) => `/finance-decisions/${id}`,
  finance_decision_reviews: (id) => `/finance-decisions/${id}`,
  investment_decisions: (id) => `/investment-decisions/${id}`,
  capital_allocations: (id) => `/capital-allocations/${id}`,
  finance_reviews: (id) => `/finance-reviews/${id}`,
  decision_reports: (id) => `/decision-reports/${id}`,
  codex_jobs: (id) => `/codex-jobs/${id}`,
  knowledge_sop: (id) => `/knowledge-sop/${id}`,
  credit_card_obligations: () => "/review-queue",
  finance_snapshots: () => "/finance-baseline",
  account_balances: () => "/finance-baseline",
  liabilities: () => "/finance-baseline",
  decision_scenarios: () => "/decision-lab",
  recovery_plans: () => "/recovery-plans",
  weekly_reviews: () => "/weekly-review",
  monthly_closes: () => "/monthly-close",
  decision_followups: () => "/followups"
};

export const reviewQueueGroups = [
  "財務決策待審核",
  "投資決策待審核",
  "資本配置待審核",
  "CFO / Finance Review 待審核",
  "任務派工待審核",
  "SOP / Codex Jobs 待審核",
  "信用卡 / 分期待補資料",
  "財務基準待補資料",
  "決策實驗 / 回收計畫待審核",
  "週月結 / Followup 待審核",
  "Advisor Drafts 待審核"
] as const;

export function isReviewQueueCandidate(item: AnyRecord) {
  const status = String(item.status ?? item.decision_status ?? "");
  return item.need_mark_review === true || item.needs_mark_review === true || ["draft", "waiting_mark_input", "waiting_review", "waiting_mark", "needs_more_info", "pending"].includes(status);
}

export function toReviewQueueItem(collectionName: string, item: AnyRecord): ReviewQueueItem {
  const id = String(item.id ?? "");
  const status = displayText(item.status ?? item.decision_status, "pending");
  const group =
    collectionName === "finance_decisions" || collectionName === "finance_decision_reviews" ? "財務決策待審核" :
    collectionName === "investment_decisions" ? "投資決策待審核" :
    collectionName === "capital_allocations" ? "資本配置待審核" :
    collectionName === "finance_reviews" ? "CFO / Finance Review 待審核" :
    collectionName === "task_dispatches" ? "任務派工待審核" :
    collectionName === "credit_card_obligations" ? "信用卡 / 分期待補資料" :
    collectionName === "finance_snapshots" || collectionName === "account_balances" || collectionName === "liabilities" ? "財務基準待補資料" :
    collectionName === "decision_scenarios" || collectionName === "recovery_plans" ? "決策實驗 / 回收計畫待審核" :
    collectionName === "weekly_reviews" || collectionName === "monthly_closes" || collectionName === "decision_followups" ? "週月結 / Followup 待審核" :
    collectionName === "advisor_threads" || collectionName === "advisor_messages" || collectionName === "advisor_action_drafts" ? "Advisor Drafts 待審核" :
    "SOP / Codex Jobs 待審核";
  const risk = displayText(item.risk_level ?? item.liquidity_risk ?? item.threshold_status, "unknown");
  const missing = asArray<string>(item.missing_required_fields);
  const nextActions = asArray<string>(item.next_actions);
  const needsReviewDraft = collectionName === "finance_decisions" && !item.review_id && String(item.status ?? "").includes("waiting");
  return {
    id,
    title: displayText(item.title ?? item.card_name ?? item.goal ?? item.summary, "待審核項目"),
    collection: collectionName,
    group,
    status,
    risk_level: risk,
    risk_priority: risk === "critical" ? 4 : risk === "high" ? 3 : risk === "medium" || risk === "warning" ? 2 : risk === "watch" ? 1 : 0,
    recommendation: displayText(item.recommendation, needsReviewDraft ? "尚未產生分析，建議先產生 Review Draft" : "待 Mark review"),
    next_actions: nextActions.length ? nextActions : missing.length ? missing.map((field) => `補資料：${field}`) : needsReviewDraft ? ["產生 Review Draft"] : ["查看詳情並 review"],
    needs_review_draft: needsReviewDraft,
    created_at: item.created_at,
    missing_required_fields: missing,
    href: collectionName === "finance_decision_reviews" && item.finance_decision_id ? `/finance-decisions/${String(item.finance_decision_id)}` : (hrefs[collectionName]?.(id) ?? "/review-queue")
  };
}

export type ReviewQueueFilter = "all" | "high_risk" | "missing_info" | "finance" | "investment" | "credit" | "sop_codex" | "today";
export type ReviewQueueSort = "risk" | "newest" | "missing";

export function buildReviewQueue(input: Record<string, AnyRecord[]>, options: { filter?: ReviewQueueFilter; sort?: ReviewQueueSort } = {}) {
  const filter = options.filter ?? "all";
  const sort = options.sort ?? "risk";
  const queue = Object.entries(input)
    .flatMap(([collectionName, items]) => asArray<AnyRecord>(items).filter(isReviewQueueCandidate).map((item) => toReviewQueueItem(collectionName, item)))
    .filter((item) =>
      filter === "all" ||
      (filter === "high_risk" && item.risk_priority >= 3) ||
      (filter === "missing_info" && item.missing_required_fields.length > 0) ||
      (filter === "finance" && item.group === "財務決策待審核") ||
      (filter === "investment" && item.group === "投資決策待審核") ||
      (filter === "credit" && item.group === "信用卡 / 分期待補資料") ||
      (filter === "sop_codex" && item.group === "SOP / Codex Jobs 待審核") ||
      (filter === "today" && (item.risk_priority >= 3 || item.missing_required_fields.length > 0))
    );
  return queue.sort((a, b) => {
    if (sort === "newest") return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
    if (sort === "missing") return b.missing_required_fields.length - a.missing_required_fields.length || b.risk_priority - a.risk_priority;
    return b.risk_priority - a.risk_priority || String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
}

export function queueMissingText(item: ReviewQueueItem) {
  return safeJoin(item.missing_required_fields, "、", "None");
}
