import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, getDocs, query, where, setDoc, doc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mockRouteIntentStructured } from "../src/lib/ai/routeIntentSchema";
import { createFinanceDecisionDraft, createInvestmentDecisionDraft, generateFinanceDecisionReview } from "../src/lib/financeDecisionIntelligence";
import { createQuickInputRecords } from "../src/lib/quick-input/createQuickInputRecords";

const projectId = "mark-ai-center-finance-decision-test";
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

describe("Finance decision writes", () => {
  it("audit_logs are written for finance decision create and review", async () => {
    const db = ownerDb();
    const created = await createFinanceDecisionDraft(db, ownerUid, "我花了 18000 買課程，想知道怎麼回本", "manual");
    await generateFinanceDecisionReview(db, created.financeDecisionId, ownerUid);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs.map((item) => item.data().action)).toContain("finance_decision.create");
    expect(audits.docs.map((item) => item.data().action)).toContain("finance_decision.review");
  });

  it("Quick Input maps stock input to finance and investment draft", async () => {
    const db = ownerDb();
    const result = await createQuickInputRecords({
      db,
      userId: ownerUid,
      rawText: "股票 2330 要不要加碼",
      source: "web",
      classify: async (text) => ({
        result: mockRouteIntentStructured(text),
        mode: "mock",
        model: "mock",
        latency_ms: 1
      })
    });
    expect(result.financeDecisionId).toBeTruthy();
    expect(result.investmentDecisionId).toBeTruthy();
    expect(result.taskId).toBeNull();
    const finance = await getDocs(query(collection(db, "finance_decisions"), where("external_action_allowed", "==", false)));
    const investment = await getDocs(query(collection(db, "investment_decisions"), where("external_action_allowed", "==", false)));
    expect(finance.size).toBe(1);
    expect(investment.size).toBe(1);
  });

  it("investment decision create writes audit log and stays review gated", async () => {
    const db = ownerDb();
    await createInvestmentDecisionDraft(db, ownerUid, "股票 2330 要不要買");
    const investments = await getDocs(collection(db, "investment_decisions"));
    expect(investments.docs[0].data().need_mark_review).toBe(true);
    expect(investments.docs[0].data().external_action_allowed).toBe(false);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs[0].data().action).toBe("investment_decision.create");
  });
});
