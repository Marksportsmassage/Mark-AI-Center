import { initializeTestEnvironment, type RulesTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildAdvisorContext } from "../src/lib/advisorContext";
import { buildAdvisorAnswer, createAdvisorActionDraft, createAdvisorMessage, createAdvisorThread } from "../src/lib/advisorResponse";

const projectId = "mark-ai-center-advisor-test";
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

describe("Advisor chat writes", () => {
  it("creates thread, assistant message, action draft, and audit logs", async () => {
    const db = ownerDb();
    const thread = await createAdvisorThread(db, { user_id: ownerUid, title: "CFO", mode: "finance", summary: "test", status: "active", need_mark_review: true, external_action_allowed: false });
    const answer = buildAdvisorAnswer("finance", "我想買課程", buildAdvisorContext("finance", {}));
    const message = await createAdvisorMessage(db, { thread_id: thread.threadId, user_id: ownerUid, role: "assistant", content: answer.content, mode: "finance", context_used: answer.context_used, suggested_actions: answer.suggested_actions as never[], missing_required_fields: answer.missing_required_fields, safety_flags: answer.safety_flags, need_mark_review: true, external_action_allowed: false });
    const draft = answer.suggested_actions[0];
    await createAdvisorActionDraft(db, { user_id: ownerUid, thread_id: thread.threadId, source_message_id: message.messageId, action_type: draft.action_type, title: draft.title, summary: draft.summary, target_collection: draft.target_collection, draft_payload: draft.draft_payload, status: "draft", need_mark_review: true, external_action_allowed: false });

    expect((await getDocs(collection(db, "advisor_threads"))).size).toBe(1);
    expect((await getDocs(collection(db, "advisor_messages"))).docs[0].data().need_mark_review).toBe(true);
    expect((await getDocs(collection(db, "advisor_action_drafts"))).docs[0].data().external_action_allowed).toBe(false);
    const audits = await getDocs(collection(db, "audit_logs"));
    expect(audits.docs.map((item) => item.data().action)).toEqual(expect.arrayContaining(["advisor_thread.create", "advisor_message.assistant", "advisor_action_draft.create"]));
  });

  it("owner-only rules protect advisor collections", async () => {
    const owner = ownerDb();
    const outsider = testEnv.authenticatedContext("not-owner").firestore();
    await assertSucceeds(getDocs(collection(owner, "advisor_threads")));
    await assertFails(getDocs(collection(outsider, "advisor_threads")));
    await assertSucceeds(getDocs(collection(owner, "advisor_messages")));
    await assertFails(getDocs(collection(outsider, "advisor_messages")));
    await assertSucceeds(getDocs(collection(owner, "advisor_action_drafts")));
    await assertFails(getDocs(collection(outsider, "advisor_action_drafts")));
  });
});
