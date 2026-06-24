import {
  addDoc,
  collection,
  doc,
  type Firestore,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import type { FinanceReview, FinancialProfile, RiskLevel, TaskDispatch } from "@/types/firestore";

export const MARK_FINANCE_INPUTS = [
  "目前可動用現金",
  "每月生活費",
  "每月固定支出",
  "安全現金水位目標",
  "股票 / 投資部位估值",
  "可接受最大創業測試預算",
  "可接受最大單項虧損",
  "是否有近期大額支出"
];

export const FINANCE_RISK_REMINDERS = [
  "不得動用安全現金水位",
  "高風險創業只能用測試預算",
  "不可把投資未實現獲利當成穩定現金流",
  "創業加碼前必須先通過小額測試",
  "每個副業都必須有停損線",
  "不可讓單一副業影響生活費與主業現金流"
];

export const FINANCE_REVIEW_PROJECTS = [
  "apparel_business",
  "ichiban_kuji_business",
  "beverage_business",
  "capital_compounding",
  "body_state_app",
  "body_state_business_app",
  "finance_risk",
  "startup_radar"
];

export function missingFinancialProfileFields(profile: FinancialProfile | null) {
  if (!profile) return MARK_FINANCE_INPUTS;
  const missing: string[] = [];
  if (profile.current_cash_available === null || profile.current_cash_available === undefined) missing.push("目前可動用現金");
  if (profile.monthly_living_expense === null || profile.monthly_living_expense === undefined) missing.push("每月生活費");
  if (profile.monthly_fixed_costs === null || profile.monthly_fixed_costs === undefined) missing.push("每月固定支出");
  if (profile.safety_cash_reserve_target === null || profile.safety_cash_reserve_target === undefined) missing.push("安全現金水位目標");
  if (profile.current_investment_value === null || profile.current_investment_value === undefined) missing.push("股票 / 投資部位估值");
  if (profile.capital_deployment_limit === null || profile.capital_deployment_limit === undefined) missing.push("可接受最大創業測試預算");
  if (!profile.risk_tolerance) missing.push("可接受最大單項虧損");
  if (!profile.notes) missing.push("是否有近期大額支出");
  return missing;
}

export async function ensureFinancialProfileDraft(db: Firestore, userId: string) {
  const existing = await getDocs(query(collection(db, "financial_profile"), where("user_id", "==", userId), limit(1)));
  if (existing.docs[0]) return { profileId: existing.docs[0].id };
  const ref = await addDoc(collection(db, "financial_profile"), {
    user_id: userId,
    monthly_living_expense: null,
    safety_cash_reserve_target: null,
    current_cash_available: null,
    current_investment_value: null,
    current_debt_summary: null,
    monthly_income_estimate: null,
    monthly_fixed_costs: null,
    risk_tolerance: null,
    capital_deployment_limit: null,
    notes: null,
    missing_required_fields: MARK_FINANCE_INPUTS,
    need_mark_review: true,
    review_status: "pending",
    status: "waiting_mark_input",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "financial_profile.create_draft",
    target_collection: "financial_profile",
    target_id: ref.id,
    before: null,
    after: { status: "waiting_mark_input", missing_required_fields: MARK_FINANCE_INPUTS },
    reason: "Created empty financial profile draft for Mark input. No external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { profileId: ref.id };
}

export async function generateCapitalAllocationDraft(db: Firestore, userId: string) {
  await ensureFinancialProfileDraft(db, userId);
  const profileSnap = await getDocs(query(collection(db, "financial_profile"), where("user_id", "==", userId), limit(1)));
  const profile = profileSnap.docs[0] ? ({ id: profileSnap.docs[0].id, ...profileSnap.docs[0].data() } as FinancialProfile) : null;
  const missing = missingFinancialProfileFields(profile);
  const deployable =
    profile?.current_cash_available !== null &&
    profile?.current_cash_available !== undefined &&
    profile?.safety_cash_reserve_target !== null &&
    profile?.safety_cash_reserve_target !== undefined
      ? Math.max(0, profile.current_cash_available - profile.safety_cash_reserve_target)
      : null;
  const cappedDeployable = deployable !== null && profile?.capital_deployment_limit !== null && profile?.capital_deployment_limit !== undefined
    ? Math.min(deployable, profile.capital_deployment_limit)
    : deployable;
  const ref = await addDoc(collection(db, "capital_allocations"), {
    user_id: userId,
    title: "Capital Allocation Draft",
    summary: missing.length ? "財務資料尚未完整，僅建立 review-gated draft，不猜測金額。" : "依 Mark 手動輸入資料產生資本配置草案。",
    total_available_capital: profile?.current_cash_available ?? null,
    safety_cash_reserve: profile?.safety_cash_reserve_target ?? null,
    deployable_capital: cappedDeployable,
    allocation_items: [
      { name: "Safety cash reserve", amount: profile?.safety_cash_reserve_target ?? null, rule: "不可動用安全現金水位" },
      { name: "Small startup tests", amount: cappedDeployable, rule: "只能用核准測試預算，需停損線" },
      { name: "Investment watch", amount: null, rule: "不把未實現獲利當穩定現金流" }
    ],
    risk_items: FINANCE_RISK_REMINDERS.map((item) => ({ risk: item, level: "high" })),
    missing_required_fields: missing,
    decision_status: missing.length ? "needs_more_info" : "waiting_mark_review",
    need_mark_review: true,
    review_status: "pending",
    external_action_allowed: false,
    thesis: "Review-gated capital allocation draft.",
    risk_level: "high",
    action_required: "Mark review required before any allocation.",
    no_auto_trade: true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "capital_allocation.generate_draft",
    target_collection: "capital_allocations",
    target_id: ref.id,
    before: null,
    after: { decision_status: missing.length ? "needs_more_info" : "waiting_mark_review", external_action_allowed: false },
    reason: "Generated capital allocation draft. No payment, transfer, trade, order, or startup execution occurred.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { allocationId: ref.id };
}

function financeRecommendation(task: TaskDispatch): FinanceReview["recommendation"] {
  if (task.project_id === "beverage_business") return "delay";
  if (task.project_id === "apparel_business") return "small_test";
  if (task.project_id === "capital_compounding" || task.project_id === "finance_risk") return "needs_mark_input";
  return "research";
}

function liquidityRisk(task: TaskDispatch): RiskLevel | "unknown" {
  if (task.project_id === "beverage_business" || task.risk_level === "high") return "high";
  if (task.project_id === "apparel_business" || task.project_id === "ichiban_kuji_business") return "medium";
  return task.risk_level ?? "unknown";
}

export function buildFinanceReviewDraft(task: TaskDispatch): Omit<FinanceReview, "id" | "created_at" | "updated_at"> {
  const missing = ["目前可動用現金", "安全現金水位目標", "可接受最大單項虧損", "近期大額支出"];
  return {
    source_task_dispatch_id: task.id,
    project_id: task.project_id ?? null,
    title: `Finance Review Draft - ${task.title}`,
    summary: "CFO / Finance Review draft. It is review-gated and does not approve any external action.",
    capital_required: task.capital_required ?? null,
    cashflow_impact: task.cashflow_impact ?? null,
    roi_assumption: task.expected_roi ?? null,
    payback_period: task.payback_period ?? null,
    liquidity_risk: liquidityRisk(task),
    worst_case_loss: task.capital_required ?? "needs_mark_input",
    stop_loss_conditions: ["超出核准測試預算", "安全現金水位受影響", "無法回推 ROI / 回本期", "Mark 未核准加碼"],
    recommendation: financeRecommendation(task),
    required_mark_inputs: MARK_FINANCE_INPUTS,
    missing_required_fields: missing,
    need_mark_review: true,
    review_status: "pending",
    status: "waiting_mark_input",
    external_action_allowed: false
  };
}

export async function generateFinanceReview(db: Firestore, taskId: string, userId: string) {
  const taskSnap = await getDoc(doc(db, "task_dispatches", taskId));
  if (!taskSnap.exists()) throw new Error("Task dispatch not found.");
  const task = { id: taskSnap.id, ...taskSnap.data() } as TaskDispatch;
  const draft = buildFinanceReviewDraft(task);
  const ref = await addDoc(collection(db, "finance_reviews"), {
    ...draft,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "finance_review.generate_draft",
    target_collection: "finance_reviews",
    target_id: ref.id,
    before: null,
    after: { source_task_dispatch_id: taskId, status: draft.status, external_action_allowed: false },
    reason: "Generated CFO / Finance Review draft. No payment, order, supplier contact, or external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { financeReviewId: ref.id };
}
