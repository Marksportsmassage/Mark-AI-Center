import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createFinancialProfileDraftFromIntake,
  createInvestmentDraftFromIntake,
  createSpendingDraftFromIntake
} from "../src/lib/intake";

const projectId = "mark-ai-center-intake-test";
const ownerUid = "owner-user";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8")
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", ownerUid), { role: "owner", status: "active" });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

function ownerDb() {
  return testEnv.authenticatedContext(ownerUid).firestore();
}

describe("Unified Intake writes", () => {
  it("creates financial profile draft and audit log", async () => {
    const db = ownerDb();
    const result = await createFinancialProfileDraftFromIntake(db, ownerUid, "銀行現金 120000，股票總額 80000", "2026-06", "snapshot");
    expect(result.collection).toBe("financial_profile");
    const profiles = await getDocs(collection(db, "financial_profile"));
    expect(profiles.docs[0].data().need_mark_review).toBe(true);
    expect(profiles.docs[0].data().external_action_allowed).toBe(false);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs.map((item) => item.data().action)).toContain("intake.financial_snapshot");
  });

  it("creates finance decision and credit card obligation from credit card bill text", async () => {
    const db = ownerDb();
    const results = await createSpendingDraftFromIntake(db, ownerUid, "信用卡帳單 30000 要繳");
    expect(results.map((item) => item.collection)).toContain("finance_decisions");
    expect(results.map((item) => item.collection)).toContain("credit_card_obligations");
    const obligations = await getDocs(collection(db, "credit_card_obligations"));
    expect(obligations.docs[0].data().need_mark_review).toBe(true);
    expect(obligations.docs[0].data().external_action_allowed).toBe(false);
  });

  it("creates installment obligation with monthly cashflow impact", async () => {
    const db = ownerDb();
    await createSpendingDraftFromIntake(db, ownerUid, "分期每月 2500，還有 8 期");
    const obligations = await getDocs(collection(db, "credit_card_obligations"));
    expect(obligations.docs[0].data().monthly_cashflow_impact).toBe(2500);
  });

  it("creates investment decision draft and audit log", async () => {
    const db = ownerDb();
    await createInvestmentDraftFromIntake(db, ownerUid, "股票 2330 要不要加碼", { symbol: "2330" });
    const investments = await getDocs(collection(db, "investment_decisions"));
    expect(investments.docs[0].data().missing_required_fields).toContain("目前價格");
    expect(investments.docs[0].data().external_action_allowed).toBe(false);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs.map((item) => item.data().action)).toContain("investment_decision.create");
  });
});
