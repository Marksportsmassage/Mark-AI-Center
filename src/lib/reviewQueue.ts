import { asArray, displayText, safeJoin } from "@/lib/ui/safe";

export interface ReviewQueueItem {
  id: string;
  title: string;
  collection: string;
  group: string;
  status: string;
  risk_level: string;
  created_at: unknown;
  missing_required_fields: string[];
  href: string;
}

type AnyRecord = Record<string, unknown> & { id?: string };

const hrefs: Record<string, (id: string) => string> = {
  task_dispatches: (id) => `/task-dispatches/${id}`,
  finance_decisions: (id) => `/finance-decisions/${id}`,
  finance_decision_reviews: (id) => `/finance-decisions/${id}`,
  investment_decisions: (id) => `/investment-decisions/${id}`,
  capital_allocations: (id) => `/capital-allocations/${id}`,
  finance_reviews: (id) => `/finance-reviews/${id}`,
  decision_reports: (id) => `/decision-reports/${id}`,
  codex_jobs: (id) => `/codex-jobs/${id}`,
  knowledge_sop: (id) => `/knowledge-sop/${id}`,
  credit_card_obligations: () => "/review-queue"
};

export const reviewQueueGroups = [
  "財務決策待審核",
  "投資決策待審核",
  "資本配置待審核",
  "CFO / Finance Review 待審核",
  "任務派工待審核",
  "SOP / Codex Jobs 待審核",
  "信用卡 / 分期待補資料"
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
    "SOP / Codex Jobs 待審核";
  return {
    id,
    title: displayText(item.title ?? item.card_name ?? item.goal ?? item.summary, "待審核項目"),
    collection: collectionName,
    group,
    status,
    risk_level: displayText(item.risk_level ?? item.liquidity_risk ?? item.threshold_status, "unknown"),
    created_at: item.created_at,
    missing_required_fields: asArray<string>(item.missing_required_fields),
    href: collectionName === "finance_decision_reviews" && item.finance_decision_id ? `/finance-decisions/${String(item.finance_decision_id)}` : (hrefs[collectionName]?.(id) ?? "/review-queue")
  };
}

export function buildReviewQueue(input: Record<string, AnyRecord[]>) {
  return Object.entries(input)
    .flatMap(([collectionName, items]) => asArray<AnyRecord>(items).filter(isReviewQueueCandidate).map((item) => toReviewQueueItem(collectionName, item)))
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
}

export function queueMissingText(item: ReviewQueueItem) {
  return safeJoin(item.missing_required_fields, "、", "None");
}
