import { initializeTestEnvironment, type RulesTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildRecoveryPlan, createDecisionScenarioDraft, createRecoveryPlanDraft, simulateDecisionScenario } from "../src/lib/decisionSimulator";

const projectId = "mark-ai-center-decision-simulator-test";
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

describe("Decision simulator writes", () => {
  it("creates scenario, recovery plan, and audit logs", async () => {
    const db = ownerDb();
    await createDecisionScenarioDraft(db, simulateDecisionScenario({ userId: ownerUid, rawInput: "買課程 18000", scenarioType: "spending", amount: 18000 }));
    await createRecoveryPlanDraft(db, buildRecoveryPlan({ userId: ownerUid, title: "課程", cost: 18000 }));
    expect((await getDocs(collection(db, "decision_scenarios"))).size).toBe(1);
    expect((await getDocs(collection(db, "recovery_plans"))).size).toBe(1);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs.map((item) => item.data().action)).toContain("decision_scenario.create_draft");
    expect(audits.docs.map((item) => item.data().action)).toContain("recovery_plan.create_draft");
  });

  it("owner-only rules protect simulator collections", async () => {
    const owner = ownerDb();
    const outsider = testEnv.authenticatedContext("not-owner").firestore();
    await assertSucceeds(getDocs(collection(owner, "decision_scenarios")));
    await assertFails(getDocs(collection(outsider, "decision_scenarios")));
    await assertSucceeds(getDocs(collection(owner, "recovery_plans")));
    await assertFails(getDocs(collection(outsider, "recovery_plans")));
  });
});
