import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCfoBriefDraft } from "../src/lib/cfoBrief";

const projectId = "mark-ai-center-cfo-brief-test";
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

describe("CFO Brief writes", () => {
  it("writes daily_briefs and audit_logs without external action", async () => {
    const db = ownerDb();
    const result = await createCfoBriefDraft(db, {
      userId: ownerUid,
      dateKey: "2026-06-24",
      reviewQueueItems: [{ id: "q1", title: "Review capital risk", collection: "finance_decisions", group: "財務決策待審核", status: "waiting_review", risk_level: "high", risk_priority: 3, recommendation: "delay", next_actions: ["review"], needs_review_draft: false, created_at: "", missing_required_fields: [], href: "/finance-decisions/fd-1" }]
    });
    expect(result.briefId).toBeTruthy();
    const briefs = await getDocs(collection(db, "daily_briefs"));
    expect(briefs.docs[0].data().need_mark_review).toBe(true);
    expect(briefs.docs[0].data().external_action_allowed).toBe(false);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs[0].data().action).toBe("cfo_brief.create_draft");
    expect(audits.docs[0].data().reason).toContain("No LINE");
  });
});
