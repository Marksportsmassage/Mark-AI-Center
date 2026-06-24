import { describe, expect, it } from "vitest";
import {
  parseFinancialSnapshotText,
  parseInvestmentDecisionText,
  parseProjectDecisionText,
  parseSpendingDecisionText
} from "../src/lib/intake";

describe("Unified Intake parser", () => {
  it("intake creates financial profile draft shape from snapshot text", () => {
    const parsed = parseFinancialSnapshotText("銀行現金 120000，股票總額 80000，固定支出 30000，生活費 25000");
    expect(parsed.current_cash_available).toBe(120000);
    expect(parsed.current_investment_value).toBe(80000);
    expect(parsed.monthly_fixed_costs).toBe(30000);
  });

  it("intake does not guess missing bank amounts", () => {
    const parsed = parseFinancialSnapshotText("銀行帳戶之後補，信用卡帳單還沒整理");
    expect(parsed.current_cash_available).toBeNull();
    expect(parsed.missing_required_fields).toContain("目前可動用現金");
  });

  it("intake creates finance decision draft from Line Pay spending", () => {
    const parsed = parseSpendingDecisionText("Line Pay 警訊支出 12000 買課程");
    expect(parsed.payment_method).toBe("Line Pay");
    expect(parsed.is_warning_signal).toBe(true);
    expect(parsed.external_action_allowed).toBe(false);
  });

  it("intake creates credit card obligation intent from credit card bill text", () => {
    const parsed = parseSpendingDecisionText("信用卡帳單 30000 要繳");
    expect(parsed.decision_type).toBe("credit_card_payment");
    expect(parsed.category).toBe("debt");
  });

  it("intake creates installment obligation with monthly cashflow impact", () => {
    const parsed = parseSpendingDecisionText("分期每月 2500，還有 8 期");
    expect(parsed.decision_type).toBe("installment");
    expect(parsed.is_recurring).toBe(true);
    expect(parsed.amount).toBe(2500);
  });

  it("intake creates investment decision draft from stock input", () => {
    const parsed = parseInvestmentDecisionText("股票 2330 要不要加碼", { symbol: "2330" });
    expect(parsed.symbol).toBe("2330");
    expect(parsed.missing_required_fields).toContain("目前價格");
    expect(parsed.external_action_allowed).toBe(false);
  });

  it("project decision parser detects startup or asset purchase", () => {
    const parsed = parseProjectDecisionText("想做一番賞直播創業測試，預算 20000");
    expect(["startup_test", "asset_purchase"]).toContain(parsed.decision_type);
    expect(parsed.need_mark_review).toBe(true);
  });

  it("no OpenAI real API call or secret output", () => {
    const source = `${parseFinancialSnapshotText}${parseSpendingDecisionText}${parseInvestmentDecisionText}`;
    expect(source).not.toContain("OPENAI_API_KEY");
    expect(source.toLowerCase()).not.toContain("openai");
  });
});
