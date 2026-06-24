import { initializeTestEnvironment, type RulesTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createBusinessExperimentDraft, createClientProfileDraft, createClientSessionDraft, createContentDraft, createProductFeatureDraft } from "../src/lib/nonFinanceOps";

const projectId = "mark-ai-center-non-finance-test";
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

describe("Non-finance operating branch writes", () => {
  it("creates client/content/business/product drafts and audit logs", async () => {
    const db = ownerDb();
    await createClientProfileDraft(db, ownerUid, { displayName: "Client A" });
    await createClientSessionDraft(db, ownerUid, { notes: "session" });
    await createContentDraft(db, ownerUid, { title: "IG draft" });
    await createBusinessExperimentDraft(db, ownerUid, { title: "飲料店測試", stopLoss: "無訂單即停止" });
    await createProductFeatureDraft(db, ownerUid, { title: "Feature" });
    expect((await getDocs(collection(db, "client_profiles"))).docs[0].data().need_mark_review).toBe(true);
    expect((await getDocs(collection(db, "client_sessions"))).docs[0].data().external_action_allowed).toBe(false);
    expect((await getDocs(collection(db, "content_drafts"))).docs[0].data().no_auto_post).toBe(true);
    expect((await getDocs(collection(db, "business_experiments"))).docs[0].data().stop_loss).toContain("停止");
    expect((await getDocs(collection(db, "product_features"))).docs[0].data().external_action_allowed).toBe(false);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.size).toBeGreaterThanOrEqual(5);
  });

  it("owner-only rules protect non-finance collections", async () => {
    const owner = ownerDb();
    const outsider = testEnv.authenticatedContext("not-owner").firestore();
    for (const name of ["client_profiles", "client_sessions", "content_drafts", "business_experiments", "product_features"]) {
      await assertSucceeds(getDocs(collection(owner, name)));
      await assertFails(getDocs(collection(outsider, name)));
    }
  });
});
