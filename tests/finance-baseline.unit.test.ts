import { describe, expect, it } from "vitest";
import { buildAccountBalanceDraft, buildLiabilityDraft, calculateFinanceSnapshot, sumAccountBalances } from "../src/lib/financeBaseline";

const userId = "owner-user";

describe("Finance Baseline Engine", () => {
  it("finance snapshot net worth calculation", () => {
    const snapshot = calculateFinanceSnapshot({
      userId,
      snapshotDate: "2026-06-24",
      monthKey: "2026-06",
      accountBalances: [{ account_type: "bank", balance: 120000 }, { account_type: "brokerage", balance: 80000 }],
      liabilities: [{ current_balance: 30000, monthly_cashflow_impact: 3000 }]
    });
    expect(snapshot.total_assets).toBe(200000);
    expect(snapshot.total_liabilities).toBe(30000);
    expect(snapshot.net_worth).toBe(170000);
  });

  it("account balances sum correctly", () => {
    expect(sumAccountBalances([{ account_type: "bank", balance: 100 }, { account_type: "bank", balance: 200 }, { account_type: "cash", balance: 50 }], "bank")).toBe(300);
  });

  it("liabilities monthly cashflow impact", () => {
    const snapshot = calculateFinanceSnapshot({ userId, snapshotDate: "2026-06-24", monthKey: "2026-06", liabilities: [{ monthly_cashflow_impact: 1800 }, { monthly_payment: 2200 }] });
    expect(snapshot.monthly_debt_payments).toBe(4000);
  });

  it("missing financial data is listed", () => {
    const snapshot = calculateFinanceSnapshot({ userId, snapshotDate: "2026-06-24", monthKey: "2026-06" });
    expect(snapshot.missing_required_fields).toContain("account_balances");
    expect(snapshot.status).toBe("waiting_mark_input");
  });

  it("available cash after reserve calculation", () => {
    const snapshot = calculateFinanceSnapshot({
      userId,
      snapshotDate: "2026-06-24",
      monthKey: "2026-06",
      accountBalances: [{ account_type: "bank", balance: 120000 }, { account_type: "cash", balance: 30000 }],
      financialProfile: { safety_cash_reserve_target: 100000, monthly_fixed_costs: 30000, monthly_living_expense: 30000, monthly_income_estimate: 80000, missing_required_fields: [] } as never
    });
    expect(snapshot.available_cash_after_reserve).toBe(50000);
    expect(snapshot.safety_cash_reserve_months).toBeCloseTo(3.33, 1);
  });

  it("drafts are review-gated and have no external action", () => {
    const account = buildAccountBalanceDraft(userId, { account_name: "中信", account_type: "bank", balance: 1000 });
    const liability = buildLiabilityDraft(userId, { lender_name: "信用卡", monthly_payment: 2000 });
    expect(account.need_mark_review).toBe(true);
    expect(account.external_action_allowed).toBe(false);
    expect(liability.need_mark_review).toBe(true);
    expect(liability.external_action_allowed).toBe(false);
  });
});
