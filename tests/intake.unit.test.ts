import { describe, expect, it } from "vitest";
import {
  parseBatchIntakeText,
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

  it("financial snapshot sums explicit bank section amounts without guessing", () => {
    const parsed = parseFinancialSnapshotText("中信 120000\n玉山 80000\n現金 30000");
    expect(parsed.current_cash_available).toBe(230000);
  });

  it("intake creates finance decision draft from Line Pay spending", () => {
    const parsed = parseSpendingDecisionText("Line Pay 警訊支出 12000 買課程");
    expect(parsed.payment_method).toBe("Line Pay");
    expect(parsed.is_warning_signal).toBe(true);
    expect(parsed.external_action_allowed).toBe(false);
  });

  it("batch parser separates financial snapshot, cards, spending, investments, and projects", () => {
    const parsed = parseBatchIntakeText(`銀行：
中信 120000
玉山 80000

信用卡：
本期帳單 28000
分期 手機 1800/月 剩 10 期

Line Pay：
6/24 課程 18000

股票：
MU 成本 200 美元，想判斷續抱或加碼

創業：
按摩椅資產購買 30000`);
    expect(parsed.financial_snapshot).toContain("中信 120000");
    expect(parsed.credit_card_items).toContain("本期帳單 28000");
    expect(parsed.spending_items).toContain("6/24 課程 18000");
    expect(parsed.investment_items[0]).toContain("MU");
    expect(parsed.project_items[0]).toContain("按摩椅");
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
