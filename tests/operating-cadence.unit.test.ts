import { describe, expect, it } from "vitest";
import { buildDecisionFollowup, buildFollowupFromRecoveryPlan, buildMonthlyClose, buildWeeklyReview } from "../src/lib/operatingCadence";
import { buildTodayDashboardSummary } from "../src/lib/today";
import type { CreditCardObligation, DecisionFollowup, ExpenseSignal, FinanceDecision, FinanceSnapshot, InvestmentDecision, RecoveryPlan } from "../src/types/firestore";

const expenseSignal: ExpenseSignal = {
  id: "signal-1",
  user_id: "owner",
  month_key: "2026-06",
  total_warning_spending: 42000,
  total_asset_purchase: 12000,
  total_investment_related: 8000,
  total_startup_test: 5000,
  total_credit_card_payment: 28000,
  total_installments_monthly: 3600,
  warning_items: ["課程 18000", "衣服 5200"],
  risk_summary: "支出偏高",
  threshold_status: "warning",
  triggered_rules: ["warning_spending_ratio"],
  missing_required_fields: [],
  next_actions: ["補信用卡帳單"],
  need_mark_review: true,
  created_at: "2026-06-24",
  updated_at: "2026-06-24"
};

const investmentDecision: InvestmentDecision = {
  id: "investment-1",
  user_id: "owner",
  asset_type: "stock",
  symbol: "MU",
  market: "US",
  position_type: "add",
  cost_basis: 200,
  current_price: null,
  quantity: 10,
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
  average_down_conditions: [],
  max_position_limit: null,
  cashflow_impact: "需要補安全現金水位",
  missing_required_fields: ["current_price", "original_thesis"],
  need_mark_review: true,
  external_action_allowed: false,
  status: "waiting_mark_input",
  created_at: "2026-06-24",
  updated_at: "2026-06-24"
};

const financeDecision: FinanceDecision = {
  id: "finance-1",
  user_id: "owner",
  source: "manual",
  raw_input: "課程 18000",
  title: "課程 18000",
  amount: 18000,
  currency: "TWD",
  occurred_at: "2026-06-24",
  decision_stage: "considering",
  decision_type: "warning_spending",
  category: "course",
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
  created_at: "2026-06-24",
  updated_at: "2026-06-24"
};

describe("operating cadence helpers", () => {
  it("weekly review includes top risks and stays review-gated", () => {
    const review = buildWeeklyReview({
      userId: "owner",
      weekKey: "2026-W4",
      expenseSignals: [expenseSignal],
      investments: [investmentDecision],
      financeDecisions: [financeDecision]
    });

    expect(review.summary).toContain("支出風險訊號");
    expect(review.top_risks.join(" ")).toContain("warning");
    expect(review.top_risks.join(" ")).toContain("MU");
    expect(review.need_mark_review).toBe(true);
    expect(review.external_action_allowed).toBe(false);
    expect(review.status).toBe("draft");
  });

  it("monthly close includes finance snapshot and avoids credit card payment double count", () => {
    const snapshot: FinanceSnapshot = {
      id: "snapshot-1",
      user_id: "owner",
      snapshot_date: "2026-06-24",
      month_key: "2026-06",
      total_cash: 230000,
      total_bank_balance: 200000,
      total_investment_value: 80000,
      total_assets: 310000,
      total_liabilities: 28000,
      net_worth: 282000,
      monthly_income_estimate: 90000,
      monthly_fixed_expenses: 30000,
      monthly_variable_expenses_estimate: null,
      monthly_debt_payments: 28000,
      safety_cash_reserve_target: 180000,
      safety_cash_reserve_months: 6,
      available_cash_after_reserve: 50000,
      investment_allocation_summary: null,
      liability_summary: "信用卡 28000",
      missing_required_fields: [],
      risk_level: "medium",
      need_mark_review: true,
      external_action_allowed: false,
      status: "draft",
      created_at: "2026-06-24",
      updated_at: "2026-06-24"
    };
    const card: CreditCardObligation = {
      id: "card-1",
      user_id: "owner",
      card_name: "中信",
      billing_month: "2026-06",
      total_statement_amount: 28000,
      minimum_payment: 3000,
      due_date: "2026-06-30",
      paid_amount: null,
      payment_status: "unpaid",
      installment_items: [],
      recurring_charges: [],
      risk_notes: [],
      monthly_cashflow_impact: 28000,
      need_mark_review: true,
      external_action_allowed: false,
      status: "waiting_review",
      created_at: "2026-06-24",
      updated_at: "2026-06-24"
    };

    const close = buildMonthlyClose({
      userId: "owner",
      monthKey: "2026-06",
      snapshot,
      expenseSignals: [expenseSignal],
      investments: [investmentDecision],
      creditCards: [card]
    });

    expect(close.net_worth_snapshot_id).toBe("snapshot-1");
    expect(close.cashflow_result).toContain("282000");
    expect(close.expense_summary).toContain("不 double count");
    expect(close.warning_spending_total).toBe(42000);
    expect(close.debt_change_summary).toContain("28000");
    expect(close.need_mark_review).toBe(true);
    expect(close.external_action_allowed).toBe(false);
  });

  it("builds decision followups and reminders for today", () => {
    const followup = buildDecisionFollowup({
      userId: "owner",
      sourceCollection: "finance_decisions",
      sourceId: "finance-1",
      title: "確認課程回本",
      expectedResult: "回收 18000",
      followupDate: "2026-06-30"
    });
    const summary = buildTodayDashboardSummary({ decisionFollowups: [{ id: "followup-1", ...followup, created_at: "2026-06-24", updated_at: "2026-06-24" }] as DecisionFollowup[] });

    expect(followup.need_mark_review).toBe(true);
    expect(followup.external_action_allowed).toBe(false);
    expect(summary.followup_reminders.join(" ")).toContain("確認課程回本");
  });

  it("creates followup draft from recovery plan without external action", () => {
    const plan: RecoveryPlan = {
      id: "recovery-1",
      user_id: "owner",
      source_decision_id: "finance-1",
      source_collection: "finance_decisions",
      title: "課程回收計畫",
      cost_to_recover: 18000,
      recovery_methods: ["補課後回收方式"],
      offset_methods: [],
      breakeven_plan: [],
      expected_recovery_deadline: "2026-07-31",
      tracking_metrics: [],
      stop_loss_conditions: [],
      need_mark_review: true,
      external_action_allowed: false,
      status: "draft",
      created_at: "2026-06-24",
      updated_at: "2026-06-24"
    };

    const followup = buildFollowupFromRecoveryPlan("owner", plan, "2026-07-31");
    expect(followup.source_collection).toBe("recovery_plans");
    expect(followup.source_id).toBe("recovery-1");
    expect(followup.need_mark_review).toBe(true);
    expect(followup.external_action_allowed).toBe(false);
  });

  it("handles empty inputs without crashing", () => {
    expect(buildWeeklyReview({ userId: "owner", weekKey: "2026-W4" }).top_risks).toEqual([]);
    expect(buildMonthlyClose({ userId: "owner", monthKey: "2026-06" }).warning_spending_total).toBe(0);
  });
});
