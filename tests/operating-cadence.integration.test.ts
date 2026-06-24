import { initializeTestEnvironment, type RulesTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildDecisionFollowup, buildMonthlyClose, buildWeeklyReview, createDecisionFollowupDraft, createMonthlyCloseDraft, createWeeklyReviewDraft } from "../src/lib/operatingCadence";

const projectId = "mark-ai-center-operating-cadence-test";
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

describe("Operating cadence writes", () => {
  it("creates weekly review, monthly close, followup, and audit logs", async () => {
    const db = ownerDb();
    await createWeeklyReviewDraft(db, buildWeeklyReview({ userId: ownerUid, weekKey: "2026-W4" }));
    await createMonthlyCloseDraft(db, buildMonthlyClose({ userId: ownerUid, monthKey: "2026-06" }));
    await createDecisionFollowupDraft(db, buildDecisionFollowup({ userId: ownerUid, sourceCollection: "manual", sourceId: "manual", title: "確認回收", followupDate: "2026-06-30" }));

    expect((await getDocs(collection(db, "weekly_reviews"))).size).toBe(1);
    expect((await getDocs(collection(db, "monthly_closes"))).size).toBe(1);
    expect((await getDocs(collection(db, "decision_followups"))).size).toBe(1);

    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs.map((item) => item.data().action)).toEqual(expect.arrayContaining([
      "weekly_review.create_draft",
      "monthly_close.create_draft",
      "decision_followup.create_draft"
    ]));
  });

  it("owner-only rules protect operating cadence collections", async () => {
    const owner = ownerDb();
    const outsider = testEnv.authenticatedContext("not-owner").firestore();

    await assertSucceeds(getDocs(collection(owner, "weekly_reviews")));
    await assertFails(getDocs(collection(outsider, "weekly_reviews")));
    await assertSucceeds(getDocs(collection(owner, "monthly_closes")));
    await assertFails(getDocs(collection(outsider, "monthly_closes")));
    await assertSucceeds(getDocs(collection(owner, "decision_followups")));
    await assertFails(getDocs(collection(outsider, "decision_followups")));
  });
});
