import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDraftsFromBatchIntake } from "../src/lib/intake";
import { createFinanceBaselineDraft } from "../src/lib/financeBaseline";

const projectId = "mark-ai-center-finance-baseline-test";
const ownerUid = "owner-user";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync("firestore.rules", "utf8") } });
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

describe("Finance baseline writes", () => {
  it("owner can create finance snapshot, account balances, liabilities, and audit log", async () => {
    const db = ownerDb();
    const result = await createFinanceBaselineDraft(db, {
      userId: ownerUid,
      snapshotDate: "2026-06-24",
      monthKey: "2026-06",
      accountBalances: [{ account_name: "中信", account_type: "bank", balance: 120000 }],
      liabilities: [{ lender_name: "信用卡", liability_type: "credit_card", current_balance: 28000, monthly_payment: 28000 }]
    });
    expect(result.snapshotId).toBeTruthy();
    expect((await getDocs(collection(db, "finance_snapshots"))).size).toBe(1);
    expect((await getDocs(collection(db, "account_balances"))).size).toBe(1);
    expect((await getDocs(collection(db, "liabilities"))).size).toBe(1);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs.map((item) => item.data().action)).toContain("finance_baseline.create_draft");
  });

  it("owner-only rules protect finance baseline collections", async () => {
    const owner = ownerDb();
    const outsider = testEnv.authenticatedContext("not-owner").firestore();
    await assertSucceeds(getDocs(collection(owner, "finance_snapshots")));
    await assertFails(getDocs(collection(outsider, "finance_snapshots")));
  });

  it("/intake batch can create finance baseline draft", async () => {
    const db = ownerDb();
    const results = await createDraftsFromBatchIntake(db, ownerUid, "銀行：\n中信 120000\n玉山 80000\n現金 30000", { autoReview: false, monthKey: "2026-06" });
    expect(results.map((item) => item.collection)).toContain("finance_snapshots");
    expect((await getDocs(collection(db, "account_balances"))).size).toBe(3);
  });
});
