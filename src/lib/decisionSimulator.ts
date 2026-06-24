import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import type { CapitalAllocation, DecisionScenario, FinanceDecision, FinanceSnapshot, InvestmentDecision, RecoveryPlan } from "@/types/firestore";

export function evaluateBreakeven(cost: number | null, expectedMonthlyRecovery: number | null) {
  if (!cost || !expectedMonthlyRecovery || expectedMonthlyRecovery <= 0) return null;
  return Math.ceil(cost / expectedMonthlyRecovery);
}

export function evaluateSafetyReserveImpact(amount: number | null, snapshot?: FinanceSnapshot | null) {
  if (!snapshot || amount === null) return "需要 finance baseline 才能判斷安全現金水位影響。";
  const available = snapshot.available_cash_after_reserve;
  if (available === null) return "需要安全現金水位目標。";
  if (amount > available) return "會壓到安全現金水位，不建議執行。";
  return `執行後仍保留約 ${available - amount} TWD 可用安全餘裕。`;
}

export function simulateDecisionScenario(input: {
  userId: string;
  rawInput: string;
  scenarioType: DecisionScenario["scenario_type"];
  amount: number | null;
  expectedReturn?: number | null;
  expectedSavings?: number | null;
  expectedIncomeLift?: number | null;
  timeHorizonMonths?: number | null;
  snapshot?: FinanceSnapshot | null;
  linkedFinanceDecisionId?: string | null;
  linkedInvestmentDecisionId?: string | null;
}): Omit<DecisionScenario, "id" | "created_at" | "updated_at"> {
  const monthlyRecovery = (input.expectedIncomeLift ?? 0) + (input.expectedSavings ?? 0);
  const breakeven = evaluateBreakeven(input.amount, monthlyRecovery || input.expectedReturn || null);
  const reserveImpact = evaluateSafetyReserveImpact(input.amount, input.snapshot);
  const missing = [input.amount === null ? "金額" : null, input.scenarioType === "startup_test" ? "停損線" : null].filter(Boolean);
  return {
    user_id: input.userId,
    scenario_type: input.scenarioType,
    title: input.rawInput.slice(0, 48) || "Decision Scenario Draft",
    raw_input: input.rawInput,
    amount: input.amount,
    currency: "TWD",
    time_horizon_months: input.timeHorizonMonths ?? null,
    expected_return: input.expectedReturn ?? null,
    expected_savings: input.expectedSavings ?? null,
    expected_income_lift: input.expectedIncomeLift ?? null,
    monthly_cashflow_impact: input.scenarioType === "debt_payment" ? input.amount : null,
    worst_case_loss: input.amount,
    breakeven_months: breakeven,
    safety_reserve_impact: reserveImpact,
    recommendation: reserveImpact.includes("不建議") || missing.length ? "needs_more_info_or_delay" : "small_test_or_stage",
    stop_loss_conditions: ["影響安全現金水位", "超過預算仍未驗證回收", "Mark 未 review 不得加碼"],
    next_actions: missing.length ? missing.map((item) => `補資料：${item}`) : ["Mark review", "設定追蹤日期", "若執行，建立 recovery plan"],
    linked_finance_decision_id: input.linkedFinanceDecisionId ?? null,
    linked_investment_decision_id: input.linkedInvestmentDecisionId ?? null,
    need_mark_review: true,
    external_action_allowed: false,
    status: missing.length ? "waiting_mark_input" : "draft"
  };
}

export function buildCapitalPlan(input: { userId: string; snapshot?: FinanceSnapshot | null }): Omit<CapitalAllocation, "id" | "created_at" | "updated_at"> {
  const reserve = input.snapshot?.safety_cash_reserve_target ?? null;
  const deployable = input.snapshot?.available_cash_after_reserve ?? null;
  return {
    user_id: input.userId,
    title: "Capital Plan Draft",
    summary: deployable === null ? "需要補 finance baseline 才能配置資本。" : `可配置資金約 ${Math.max(0, deployable)} TWD，安全現金水位不可動用。`,
    category: "reserve",
    amount_twd: deployable ?? undefined,
    total_available_capital: input.snapshot?.total_assets ?? null,
    safety_cash_reserve: reserve,
    deployable_capital: deployable,
    allocation_items: [
      { name: "不可動用資金", amount: reserve, rule: "安全現金水位" },
      { name: "可投資資金", amount: deployable ? Math.max(0, Math.floor(deployable * 0.4)) : null },
      { name: "創業測試資金", amount: deployable ? Math.max(0, Math.floor(deployable * 0.2)) : null },
      { name: "課程 / 設備 / 資產購買", amount: deployable ? Math.max(0, Math.floor(deployable * 0.2)) : null }
    ],
    risk_items: deployable !== null && deployable <= 0 ? [{ risk: "建議暫停支出", level: "high" }] : [],
    missing_required_fields: deployable === null ? ["finance_baseline", "安全現金水位"] : [],
    decision_status: "draft",
    external_action_allowed: false,
    thesis: "Protect safety reserve first.",
    risk_level: deployable === null || deployable <= 0 ? "high" : "medium",
    action_required: "Mark review",
    no_auto_trade: true,
    need_mark_review: true,
    review_status: "pending"
  };
}

export function buildRecoveryPlan(input: {
  userId: string;
  sourceId?: string | null;
  sourceCollection?: string | null;
  title: string;
  cost: number | null;
}): Omit<RecoveryPlan, "id" | "created_at" | "updated_at"> {
  return {
    user_id: input.userId,
    source_decision_id: input.sourceId ?? null,
    source_collection: input.sourceCollection ?? null,
    title: `Recovery Plan - ${input.title}`,
    cost_to_recover: input.cost,
    recovery_methods: ["接案收入抵銷", "內容化為案例 / 素材", "轉售或折舊控管", "降低未來成本"],
    offset_methods: ["縮小金額", "延後購買", "用既有資源替代", "分階段投入"],
    breakeven_plan: ["定義回收目標", "設定 30/60/90 天檢查點", "未達指標停止追加"],
    expected_recovery_deadline: null,
    tracking_metrics: ["已回收金額", "新增收入", "節省成本", "是否仍符合原始理由"],
    stop_loss_conditions: ["影響安全現金水位", "沒有驗證回收", "需要追加但假設未成立"],
    need_mark_review: true,
    external_action_allowed: false,
    status: "draft"
  };
}

export async function createDecisionScenarioDraft(db: Firestore, draft: Omit<DecisionScenario, "id" | "created_at" | "updated_at">) {
  const ref = await addDoc(collection(db, "decision_scenarios"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await addDoc(collection(db, "audit_logs"), { user_id: draft.user_id, action: "decision_scenario.create_draft", target_collection: "decision_scenarios", target_id: ref.id, before: null, after: { external_action_allowed: false, recommendation: draft.recommendation }, reason: "Created decision scenario draft. No external action executed.", created_at: serverTimestamp(), updated_at: serverTimestamp() });
  return { scenarioId: ref.id };
}

export async function createRecoveryPlanDraft(db: Firestore, draft: Omit<RecoveryPlan, "id" | "created_at" | "updated_at">) {
  const ref = await addDoc(collection(db, "recovery_plans"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await addDoc(collection(db, "audit_logs"), { user_id: draft.user_id, action: "recovery_plan.create_draft", target_collection: "recovery_plans", target_id: ref.id, before: null, after: { external_action_allowed: false, source_collection: draft.source_collection }, reason: "Created recovery plan draft. No external action executed.", created_at: serverTimestamp(), updated_at: serverTimestamp() });
  return { recoveryPlanId: ref.id };
}

export function recoveryPlanFromFinanceDecision(userId: string, decision: FinanceDecision) {
  return buildRecoveryPlan({ userId, sourceId: decision.id, sourceCollection: "finance_decisions", title: decision.title, cost: decision.amount });
}

export function recoveryPlanFromInvestmentDecision(userId: string, decision: InvestmentDecision) {
  return buildRecoveryPlan({ userId, sourceId: decision.id, sourceCollection: "investment_decisions", title: decision.symbol ?? "Investment Decision", cost: decision.market_value ?? null });
}
