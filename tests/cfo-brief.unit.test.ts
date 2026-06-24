import { describe, expect, it } from "vitest";
import { buildCfoBriefDraft } from "../src/lib/cfoBrief";
import type { CreditCardObligation, ExpenseSignal, FinanceDecision, FinancialProfile, InvestmentDecision } from "../src/types/firestore";

const userId = "owner-user";
const profile: FinancialProfile = {
  id: "profile-1",
  user_id: userId,
  monthly_living_expense: null,
  safety_cash_reserve_target: null,
  current_cash_available: 100000,
  current_investment_value: null,
  current_debt_summary: null,
  monthly_income_estimate: null,
  monthly_fixed_costs: null,
  risk_tolerance: null,
  capital_deployment_limit: null,
  notes: null,
  missing_required_fields: ["安全現金水位目標"],
  need_mark_review: true,
  external_action_allowed: false,
  review_status: "pending",
  status: "waiting_mark_input",
  created_at: "",
  updated_at: ""
};

function financeDecision(overrides: Partial<FinanceDecision> = {}): FinanceDecision {
  return {
    id: "fd-1",
    user_id: userId,
    source: "manual",
    raw_input: "Line Pay 警訊支出 30000",
    title: "Line Pay 警訊支出",
    amount: 30000,
    currency: "TWD",
    occurred_at: null,
    decision_stage: "executed",
    decision_type: "warning_spending",
    category: "spending",
    subcategory: null,
    is_asset_purchase: false,
    is_investment: false,
    is_warning_signal: true,
    is_recurring: false,
    related_project_id: null,
    related_stock_symbol: null,
    related_account: null,
    payment_method: "Line Pay",
    notes: null,
    need_mark_review: true,
    external_action_allowed: false,
    status: "waiting_review",
    created_at: "",
    updated_at: "",
    ...overrides
  };
}

const investment: InvestmentDecision = {
  id: "inv-1",
  user_id: userId,
  asset_type: "stock",
  symbol: "MU",
  market: "US",
  position_type: "add",
  cost_basis: null,
  current_price: null,
  quantity: null,
  market_value: null,
  unrealized_pnl: null,
  original_thesis: null,
  current_thesis_status: "unknown",
  time_horizon: "medium",
  buy_conditions: [],
  add_conditions: [],
  reduce_conditions: [],
  take_profit_conditions: [],
  stop_loss_conditions: [],
  average_down_allowed: false,
  average_down_conditions: ["原始理由 unknown 或 invalid，不可攤平"],
  max_position_limit: null,
  cashflow_impact: "需要補資料",
  missing_required_fields: ["成本", "目前價格", "數量", "原始買進理由"],
  need_mark_review: true,
  external_action_allowed: false,
  status: "waiting_mark_input",
  created_at: "",
  updated_at: ""
};

const signal: ExpenseSignal = {
  id: "signal-1",
  user_id: userId,
  month_key: "2026-06",
  total_warning_spending: 30000,
  total_asset_purchase: 0,
  total_investment_related: 0,
  total_startup_test: 0,
  total_credit_card_payment: 28000,
  total_installments_monthly: 1800,
  warning_items: ["Line Pay 警訊支出"],
  risk_summary: "warning",
  threshold_status: "warning",
  triggered_rules: ["警訊支出超過可投入資金"],
  need_mark_review: true,
  created_at: "",
  updated_at: ""
};

const card: CreditCardObligation = {
  id: "card-1",
  user_id: userId,
  card_name: "信用卡",
  billing_month: "2026-06",
  total_statement_amount: 28000,
  minimum_payment: null,
  due_date: null,
  paid_amount: null,
  payment_status: "draft",
  installment_items: [],
  recurring_charges: [],
  risk_notes: [],
  monthly_cashflow_impact: 28000,
  need_mark_review: true,
  external_action_allowed: false,
  status: "waiting_review",
  created_at: "",
  updated_at: ""
};

describe("CFO Brief Draft", () => {
  it("includes top priorities and high risk items", () => {
    const brief = buildCfoBriefDraft({
      userId,
      dateKey: "2026-06-24",
      financialProfile: profile,
      financeDecisions: [financeDecision()],
      investmentDecisions: [investment],
      expenseSignals: [signal],
      creditCardObligations: [card],
      reviewQueueItems: [{ id: "q1", title: "High risk review", collection: "finance_decisions", group: "財務決策待審核", status: "waiting_review", risk_level: "high", risk_priority: 3, recommendation: "delay", next_actions: ["review"], needs_review_draft: false, created_at: "", missing_required_fields: [], href: "/finance-decisions/fd-1" }]
    });
    expect(brief.top_priorities[0]).toContain("High risk review");
    expect(brief.high_risk_items?.join(" ")).toContain("High risk review");
  });

  it("includes missing financial profile fields", () => {
    const brief = buildCfoBriefDraft({ userId, dateKey: "2026-06-24", financialProfile: profile });
    expect(brief.finance_reminders?.join(" ")).toContain("安全現金水位目標");
  });

  it("includes investment reminders and does not recommend average down when thesis unknown", () => {
    const brief = buildCfoBriefDraft({ userId, dateKey: "2026-06-24", investmentDecisions: [investment] });
    expect(brief.investment_reminders?.join(" ")).toContain("average_down_allowed=false");
    expect(brief.do_not_focus.join(" ")).toContain("不建議攤平");
  });

  it("includes no-cost next actions", () => {
    const brief = buildCfoBriefDraft({ userId, dateKey: "2026-06-24" });
    expect(brief.no_cost_next_actions).toContain("查看 Review Queue");
  });

  it("all generated CFO briefs are review-gated and external actions disabled", () => {
    const brief = buildCfoBriefDraft({ userId, dateKey: "2026-06-24" });
    expect(brief.need_mark_review).toBe(true);
    expect(brief.external_action_allowed).toBe(false);
    expect(brief.status).toBe("draft");
  });

  it("does not call OpenAI or output secrets", () => {
    const source = buildCfoBriefDraft.toString();
    expect(source.toLowerCase()).not.toContain("openai");
    expect(source).not.toContain("OPENAI_API_KEY");
    expect(source).not.toContain("LINE_CHANNEL_SECRET");
  });
});
