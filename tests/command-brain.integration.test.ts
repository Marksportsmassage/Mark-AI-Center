import { initializeTestEnvironment, type RulesTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildCommandBrief, createCommandBriefDraft } from "../src/lib/commandBrain";

const projectId = "mark-ai-center-command-brain-test";
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

describe("Command Brain writes", () => {
  it("creates command brief draft and audit log", async () => {
    const db = ownerDb();
    await createCommandBriefDraft(db, buildCommandBrief({ userId: ownerUid, productFeatures: [{ id: "p1", title: "Feature", status: "draft", need_mark_review: true }] as never }));
    const briefs = await getDocs(collection(db, "command_briefs"));
    expect(briefs.size).toBe(1);
    expect(briefs.docs[0].data().external_action_allowed).toBe(false);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs.map((item) => item.data().action)).toContain("command_brief.create_draft");
  });

  it("owner-only rules protect command briefs", async () => {
    const owner = ownerDb();
    const outsider = testEnv.authenticatedContext("not-owner").firestore();
    await assertSucceeds(getDocs(collection(owner, "command_briefs")));
    await assertFails(getDocs(collection(outsider, "command_briefs")));
  });
});
