import { describe, expect, it } from "vitest";
import { buildCollectionStatus, buildDataQualityReport, publicEnvPresence, RELEASE_NOTES, SAFETY_NOTES, safetyChecklist } from "../src/lib/governance";

describe("production governance", () => {
  it("system status redacts env values", () => {
    const status = publicEnvPresence({
      NEXT_PUBLIC_FIREBASE_API_KEY: "public-api-key-value",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: undefined,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "mark-ai-center"
    });
    expect(status).toContainEqual({ key: "NEXT_PUBLIC_FIREBASE_API_KEY", status: "present" });
    expect(JSON.stringify(status)).not.toContain("public-api-key-value");
    expect(JSON.stringify(status)).not.toContain("mark-ai-center");
  });

  it("system status handles missing collections", () => {
    const status = buildCollectionStatus({
      audit_logs: { count: 3 },
      finance_snapshots: { error: "permission denied" },
      decision_followups: { isLoading: true }
    });
    expect(status.find((item) => item.name === "audit_logs")?.status).toBe("ok");
    expect(status.find((item) => item.name === "finance_snapshots")?.status).toBe("error");
    expect(status.find((item) => item.name === "decision_followups")?.status).toBe("loading");
  });

  it("release notes include safety disclaimers", () => {
    expect(RELEASE_NOTES.join(" ")).toContain("Phase 12");
    expect(SAFETY_NOTES.join(" ")).toContain("functions 未部署");
    expect(SAFETY_NOTES.join(" ")).toContain("LINE reply / push disabled");
    expect(SAFETY_NOTES.join(" ")).toContain("不自動交易");
  });

  it("governance tests confirm no external actions enabled", () => {
    expect(safetyChecklist()).toMatchObject({
      functions_deployed: false,
      line_reply_push_enabled: false,
      external_action_allowed: false,
      secrets_displayed: false,
      auto_trade_enabled: false,
      auto_payment_enabled: false
    });
  });
});

describe("data quality", () => {
  it("data quality flags missing financial baseline", () => {
    const report = buildDataQualityReport({});
    expect(report.missingFinancialBaseline).toContain("財務基本資料");
    expect(report.missingFinancialBaseline).toContain("finance_snapshot");
    expect(report.status).not.toBe("complete");
  });

  it("data quality flags missing investment fields", () => {
    const report = buildDataQualityReport({
      financialProfile: { safety_cash_reserve_target: 100000, missing_required_fields: [] } as never,
      financeSnapshots: [{ missing_required_fields: [] }] as never,
      accountBalances: [{ balance: 1000 }] as never,
      investmentDecisions: [{
        id: "i1",
        symbol: "MU",
        cost_basis: null,
        current_price: null,
        quantity: null,
        missing_required_fields: ["原始買進理由"]
      }] as never
    });
    expect(report.missingInvestmentFields.join(" ")).toContain("MU");
    expect(report.missingInvestmentFields.join(" ")).toContain("成本");
    expect(report.missingInvestmentFields.join(" ")).toContain("現價");
    expect(report.missingInvestmentFields.join(" ")).toContain("數量");
  });

  it("data quality flags credit card, installment, liability, and recovery gaps", () => {
    const report = buildDataQualityReport({
      financialProfile: { safety_cash_reserve_target: 100000, missing_required_fields: [] } as never,
      financeSnapshots: [{ missing_required_fields: [] }] as never,
      accountBalances: [{ balance: 1000 }] as never,
      creditCards: [{ card_name: "中信", total_statement_amount: null, due_date: null, installment_items: [{ name: "phone" }] }] as never,
      liabilities: [{ lender_name: "手機分期", liability_type: "installment", current_balance: null, monthly_payment: null, remaining_terms: null }] as never,
      recoveryPlans: []
    });
    expect(report.missingCreditCardFields.join(" ")).toContain("信用卡帳單");
    expect(report.missingCreditCardFields.join(" ")).toContain("剩餘期數");
    expect(report.missingLiabilityFields.join(" ")).toContain("負債餘額");
    expect(report.missingRecoveryPlans.join(" ")).toContain("recovery plans");
  });
});
