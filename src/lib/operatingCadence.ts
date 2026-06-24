import { addDoc, collection, doc, serverTimestamp, updateDoc, type Firestore } from "firebase/firestore";
import type { CreditCardObligation, DecisionFollowup, ExpenseSignal, FinanceDecision, FinanceSnapshot, InvestmentDecision, MonthlyClose, RecoveryPlan, WeeklyReview } from "@/types/firestore";

export function buildWeeklyReview(input: {
  userId: string;
  weekKey: string;
  expenseSignals?: ExpenseSignal[];
  investments?: InvestmentDecision[];
  financeDecisions?: FinanceDecision[];
  followups?: DecisionFollowup[];
}): Omit<WeeklyReview, "id" | "created_at" | "updated_at"> {
  const warningSignals = (input.expenseSignals ?? []).filter((item) => item.threshold_status !== "normal");
  const investmentReviews = (input.investments ?? []).filter((item) => item.status === "waiting_review" || item.status === "waiting_mark_input");
  const unfinished = (input.financeDecisions ?? []).filter((item) => item.status === "waiting_review" || item.status === "waiting_mark_input");
  return {
    user_id: input.userId,
    week_key: input.weekKey,
    summary: `本週有 ${warningSignals.length} 個支出風險訊號、${investmentReviews.length} 個投資待審核、${unfinished.length} 個未完成 review。`,
    top_wins: ["完成本週資料整理或維持無外部自動動作"],
    top_risks: [...warningSignals.map((item) => `${item.month_key}: ${item.threshold_status}`), ...investmentReviews.map((item) => `投資待審核：${item.symbol ?? "未命名"}`)].slice(0, 5),
    spending_warnings: warningSignals.flatMap((item) => item.warning_items ?? []).slice(0, 10),
    investment_reviews: investmentReviews.map((item) => item.symbol ?? item.id),
    unfinished_reviews: unfinished.map((item) => item.title),
    no_cost_next_actions: ["補資料", "整理 Audit Logs", "建立 SOP Draft", "清 Review Queue"],
    next_week_focus: ["先補財務基準", "先審高風險項目", "避免無資料加碼"],
    need_mark_review: true,
    external_action_allowed: false,
    status: "draft"
  };
}

export function buildMonthlyClose(input: {
  userId: string;
  monthKey: string;
  snapshot?: FinanceSnapshot | null;
  expenseSignals?: ExpenseSignal[];
  investments?: InvestmentDecision[];
  creditCards?: CreditCardObligation[];
}): Omit<MonthlyClose, "id" | "created_at" | "updated_at"> {
  const signal = input.expenseSignals?.[0] ?? null;
  const creditPressure = (input.creditCards ?? []).reduce((total, item) => total + (item.monthly_cashflow_impact ?? item.total_statement_amount ?? 0), 0);
  return {
    user_id: input.userId,
    month_key: input.monthKey,
    net_worth_snapshot_id: input.snapshot?.id ?? null,
    income_summary: `收入估計：${input.snapshot?.monthly_income_estimate ?? "待補"}`,
    expense_summary: `警訊支出 ${signal?.total_warning_spending ?? 0}，信用卡繳費不 double count 為新消費。`,
    warning_spending_total: signal?.total_warning_spending ?? 0,
    asset_purchase_total: signal?.total_asset_purchase ?? 0,
    investment_change_summary: `投資決策 ${input.investments?.length ?? 0} 筆，未抓即時市價。`,
    debt_change_summary: `信用卡 / 分期月壓力 ${creditPressure}。`,
    cashflow_result: `net_worth ${input.snapshot?.net_worth ?? "待補"}，剩餘現金流需依 cashflow 頁確認。`,
    decisions_to_review: (input.investments ?? []).filter((item) => item.status !== "reviewed").map((item) => item.symbol ?? item.id),
    lessons: ["缺資料不做結論", "信用卡繳費不重複計為消費"],
    next_month_plan: ["補財務基準", "完成高風險 review", "建立必要 followups"],
    need_mark_review: true,
    external_action_allowed: false,
    status: "draft"
  };
}

export function buildDecisionFollowup(input: {
  userId: string;
  sourceCollection: string;
  sourceId: string;
  title: string;
  expectedResult?: string | null;
  followupDate: string;
}): Omit<DecisionFollowup, "id" | "created_at" | "updated_at"> {
  return {
    user_id: input.userId,
    source_collection: input.sourceCollection,
    source_id: input.sourceId,
    title: input.title,
    expected_result: input.expectedResult ?? null,
    actual_result: null,
    followup_date: input.followupDate,
    status: "pending",
    next_action: "到期後回填 actual_result 並決定 done/missed",
    need_mark_review: true,
    external_action_allowed: false
  };
}

async function audit(db: Firestore, userId: string, action: string, collectionName: string, id: string) {
  await addDoc(collection(db, "audit_logs"), { user_id: userId, action, target_collection: collectionName, target_id: id, before: null, after: { external_action_allowed: false }, reason: "Operating cadence draft/action. No external action executed.", created_at: serverTimestamp(), updated_at: serverTimestamp() });
}

export async function createWeeklyReviewDraft(db: Firestore, draft: Omit<WeeklyReview, "id" | "created_at" | "updated_at">) {
  const ref = await addDoc(collection(db, "weekly_reviews"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, draft.user_id, "weekly_review.create_draft", "weekly_reviews", ref.id);
  return { weeklyReviewId: ref.id };
}

export async function createMonthlyCloseDraft(db: Firestore, draft: Omit<MonthlyClose, "id" | "created_at" | "updated_at">) {
  const ref = await addDoc(collection(db, "monthly_closes"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, draft.user_id, "monthly_close.create_draft", "monthly_closes", ref.id);
  return { monthlyCloseId: ref.id };
}

export async function createDecisionFollowupDraft(db: Firestore, draft: Omit<DecisionFollowup, "id" | "created_at" | "updated_at">) {
  const ref = await addDoc(collection(db, "decision_followups"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, draft.user_id, "decision_followup.create_draft", "decision_followups", ref.id);
  return { followupId: ref.id };
}

export async function updateDecisionFollowupStatus(db: Firestore, id: string, userId: string, status: DecisionFollowup["status"]) {
  await updateDoc(doc(db, "decision_followups", id), { status, updated_at: serverTimestamp() });
  await audit(db, userId, `decision_followup.${status}`, "decision_followups", id);
}

export function buildFollowupFromRecoveryPlan(userId: string, plan: RecoveryPlan, followupDate: string) {
  return buildDecisionFollowup({ userId, sourceCollection: "recovery_plans", sourceId: plan.id, title: plan.title, expectedResult: "確認回收進度", followupDate });
}
