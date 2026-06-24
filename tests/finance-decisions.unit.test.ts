import { describe, expect, it } from "vitest";
import {
  buildCreditCardObligationDraft,
  buildExpenseSignalSnapshot,
  buildFinanceDecisionDraft,
  buildFinanceDecisionReviewDraft,
  buildInvestmentDecisionDraft,
  evaluateExpenseThreshold,
  classifyFinanceDecision,
  isFinanceDecisionInput
} from "../src/lib/financeDecisionIntelligence";

const userId = "owner-user";

describe("Finance Decision Intelligence", () => {
  it("creates finance decision draft from manual input", () => {
    const draft = buildFinanceDecisionDraft("我花了 18000 買課程，想知道怎麼回本", userId);
    expect(draft.need_mark_review).toBe(true);
    expect(draft.external_action_allowed).toBe(false);
    expect(draft.amount).toBe(18000);
  });

  it("classifies warning spending", () => {
    const draft = buildFinanceDecisionDraft("Line Pay 警訊支出 12000，覺得有點衝動", userId);
    expect(draft.decision_type).toBe("warning_spending");
    expect(draft.is_warning_signal).toBe(true);
  });

  it("classifies asset purchase", () => {
    const draft = buildFinanceDecisionDraft("我買了鏡頭 22000，想拿來拍內容接案", userId);
    expect(draft.decision_type).toBe("asset_purchase");
    expect(draft.is_asset_purchase).toBe(true);
  });

  it("classifies investment decision", () => {
    const draft = buildFinanceDecisionDraft("股票 2330 要不要加碼", userId);
    expect(draft.decision_type).toBe("stock_trade");
    expect(draft.is_investment).toBe(true);
  });

  it("Credit card obligation does not double-count as new consumption", () => {
    const classification = classifyFinanceDecision("信用卡帳單 30000 要繳");
    const obligation = buildCreditCardObligationDraft(userId, "信用卡帳單 30000 要繳");
    expect(classification.decisionType).toBe("credit_card_payment");
    expect(obligation.risk_notes.join(" ")).toContain("不重複列為新消費");
  });

  it("Installment creates monthly cashflow impact", () => {
    const draft = buildFinanceDecisionDraft("分期每月 2500，還有 8 期", userId);
    expect(draft.decision_type).toBe("installment");
    const signal = buildExpenseSignalSnapshot([{ id: "d1", ...draft, created_at: "2026-06-24", updated_at: "2026-06-24" }], userId, "2026-06");
    expect(signal.total_installments_monthly).toBe(2500);
  });

  it("finance decision review includes recovery_methods, offset_methods, and stop_loss_conditions", () => {
    const decision = { id: "d1", ...buildFinanceDecisionDraft("我買了電腦 40000，想提升接案效率", userId), created_at: "", updated_at: "" };
    const review = buildFinanceDecisionReviewDraft(decision);
    expect(review.recovery_methods.length).toBeGreaterThan(0);
    expect(review.offset_methods.length).toBeGreaterThan(0);
    expect(review.stop_loss_conditions.length).toBeGreaterThan(0);
  });

  it("route-intent keyword helper maps stock / Line Pay / credit card input", () => {
    expect(isFinanceDecisionInput("股票 2330 要不要買")).toBe(true);
    expect(isFinanceDecisionInput("Line Pay 花了 5000")).toBe(true);
    expect(isFinanceDecisionInput("信用卡帳單到了")).toBe(true);
  });

  it("no OpenAI real API call or secret is required by builders", () => {
    const source = buildFinanceDecisionDraft.toString() + buildInvestmentDecisionDraft.toString();
    expect(source).not.toContain("openai");
    expect(source).not.toContain("OPENAI_API_KEY");
  });
});

describe("Investment Decision Intelligence", () => {
  it("investment decision missing fields are listed", () => {
    const draft = buildInvestmentDecisionDraft("股票 2330 要不要買", userId);
    expect(draft.missing_required_fields).toContain("成本");
    expect(draft.missing_required_fields).toContain("目前價格");
  });

  it("average down is rejected when original thesis invalid", () => {
    const draft = buildInvestmentDecisionDraft("股票 2330 想加碼，但原本理由不成立", userId);
    expect(draft.average_down_allowed).toBe(false);
    expect(draft.average_down_conditions.join(" ")).toContain("不可攤平");
  });

  it("average down is allowed only conditionally", () => {
    const draft = buildInvestmentDecisionDraft("股票 2330 想加碼，長線，原始理由仍成立", userId);
    expect(draft.average_down_allowed).toBe(true);
    expect(draft.average_down_conditions.join(" ")).toContain("條件式");
    expect(draft.external_action_allowed).toBe(false);
  });

  it("average down is rejected when original thesis is unknown", () => {
    const draft = buildInvestmentDecisionDraft("股票 2330 想加碼，長線", userId);
    expect(draft.current_thesis_status).toBe("unknown");
    expect(draft.average_down_allowed).toBe(false);
  });
});

describe("Expense Signal", () => {
  it("builds warning threshold from warning spending", () => {
    const d1 = { id: "d1", ...buildFinanceDecisionDraft("警訊支出 12000", userId), created_at: "", updated_at: "" };
    const signal = buildExpenseSignalSnapshot([d1], userId, "2026-06");
    expect(signal.threshold_status).toBe("warning");
    expect(signal.need_mark_review).toBe(true);
  });

  it("expense threshold asks for financial profile before judging deployable capital", () => {
    const d1 = { id: "d1", ...buildFinanceDecisionDraft("警訊支出 12000", userId), created_at: "", updated_at: "" };
    const threshold = evaluateExpenseThreshold({ decisions: [d1], obligations: [], profile: null });
    expect(threshold.threshold_status).toBe("watch");
    expect(threshold.missing_required_fields).toContain("需要補財務基本資料");
  });

  it("expense threshold becomes critical if spending touches safety reserve", () => {
    const d1 = { id: "d1", ...buildFinanceDecisionDraft("警訊支出 50000", userId), created_at: "", updated_at: "" };
    const threshold = evaluateExpenseThreshold({
      decisions: [d1],
      obligations: [],
      profile: {
        id: "p1",
        user_id: userId,
        monthly_living_expense: 30000,
        safety_cash_reserve_target: 100000,
        current_cash_available: 120000,
        current_investment_value: null,
        current_debt_summary: null,
        monthly_income_estimate: null,
        monthly_fixed_costs: null,
        risk_tolerance: null,
        capital_deployment_limit: null,
        notes: null,
        missing_required_fields: [],
        need_mark_review: true,
        external_action_allowed: false,
        review_status: "pending",
        status: "draft",
        created_at: "",
        updated_at: ""
      }
    });
    expect(threshold.threshold_status).toBe("critical");
  });
});
