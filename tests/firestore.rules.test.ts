import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const projectId = "mark-ai-center-rules-test";
const ownerUid = "owner-user";
const viewerUid = "viewer-user";
const inactiveOwnerUid = "inactive-owner-user";
const noProfileUid = "no-profile-user";

const protectedCollections = [
  "users",
  "projects",
  "ai_agents",
  "ai_inbox",
  "advisor_threads",
  "advisor_messages",
  "advisor_action_drafts",
  "client_profiles",
  "client_sessions",
  "content_ideas",
  "content_drafts",
  "study_notes",
  "business_experiments",
  "market_hypotheses",
  "startup_test_plans",
  "product_features",
  "roadmap_items",
  "task_dispatches",
  "daily_briefs",
  "line_events",
  "line_users",
  "decision_reports",
  "financial_profile",
  "capital_allocations",
  "finance_reviews",
  "finance_decisions",
  "finance_decision_reviews",
  "expense_signals",
  "credit_card_obligations",
  "investment_decisions",
  "finance_snapshots",
  "account_balances",
  "liabilities",
  "decision_scenarios",
  "recovery_plans",
  "weekly_reviews",
  "monthly_closes",
  "decision_followups",
  "codex_jobs",
  "startup_analyses",
  "knowledge_sop",
  "settings",
  "audit_logs",
  "ai_route_logs"
] as const;

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
    const db = context.firestore();
    await setDoc(doc(db, "users", ownerUid), { role: "owner", status: "active" });
    await setDoc(doc(db, "users", viewerUid), { role: "viewer", status: "active" });
    await setDoc(doc(db, "users", inactiveOwnerUid), { role: "owner", status: "inactive" });
    await setDoc(doc(db, "projects", "sample"), { status: "active", name: "Sample" });
    await setDoc(doc(db, "ai_agents", "sample"), { status: "active", name: "Sample" });
    await setDoc(doc(db, "task_dispatches", "sample"), {
      status: "todo",
      decision_status: "pending",
      title: "Sample"
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

function authedDb(uid: string) {
  return testEnv.authenticatedContext(uid).firestore();
}

function signedOutDb() {
  return testEnv.unauthenticatedContext().firestore();
}

function sampleWrite(collectionName: string) {
  return {
    id: "new",
    title: "Test",
    status: "new",
    role: "viewer",
    need_mark_review: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    collectionName
  };
}

describe("Firestore owner-only rules", () => {
  it("denies signed-out reads and writes", async () => {
    const db = signedOutDb();

    for (const collectionName of protectedCollections) {
      await assertFails(getDoc(doc(db, collectionName, "sample")));
    }

    await assertFails(setDoc(doc(db, "ai_inbox", "new"), sampleWrite("ai_inbox")));
    await assertFails(setDoc(doc(db, "task_dispatches", "new"), sampleWrite("task_dispatches")));
  });

  it("denies signed-in users with no users/{uid} profile", async () => {
    const db = authedDb(noProfileUid);

    await assertFails(getDoc(doc(db, "projects", "sample")));
    await assertFails(getDoc(doc(db, "ai_agents", "sample")));
    await assertFails(setDoc(doc(db, "ai_inbox", "new"), sampleWrite("ai_inbox")));
    await assertFails(setDoc(doc(db, "task_dispatches", "new"), sampleWrite("task_dispatches")));
  });

  it("denies signed-in non-owner users", async () => {
    const db = authedDb(viewerUid);

    await assertFails(getDoc(doc(db, "projects", "sample")));
    await assertFails(getDoc(doc(db, "ai_agents", "sample")));
    await assertFails(setDoc(doc(db, "ai_inbox", "new"), sampleWrite("ai_inbox")));
    await assertFails(setDoc(doc(db, "task_dispatches", "new"), sampleWrite("task_dispatches")));
  });

  it("denies inactive owners", async () => {
    const db = authedDb(inactiveOwnerUid);

    await assertFails(getDoc(doc(db, "projects", "sample")));
    await assertFails(setDoc(doc(db, "ai_inbox", "new"), sampleWrite("ai_inbox")));
    await assertFails(setDoc(doc(db, "task_dispatches", "new"), sampleWrite("task_dispatches")));
  });

  it("allows active owner reads and writes across protected collections", async () => {
    const db = authedDb(ownerUid);

    for (const collectionName of protectedCollections) {
      await assertSucceeds(getDoc(doc(db, collectionName, collectionName === "users" ? ownerUid : "sample")));
      await assertSucceeds(setDoc(doc(db, collectionName, "owner-write"), sampleWrite(collectionName)));
    }

    await assertSucceeds(setDoc(doc(db, "ai_inbox", "new"), sampleWrite("ai_inbox")));
    await assertSucceeds(setDoc(doc(db, "task_dispatches", "new"), sampleWrite("task_dispatches")));
    await assertSucceeds(
      updateDoc(doc(db, "task_dispatches", "sample"), {
        decision_status: "approved",
        status: "doing"
      })
    );

    const updated = await getDoc(doc(db, "task_dispatches", "sample"));
    expect(updated.data()?.decision_status).toBe("approved");
  });

  it("keeps decision_reports, daily_briefs, and audit_logs owner-only", async () => {
    const owner = authedDb(ownerUid);
    const viewer = authedDb(viewerUid);
    const signedOut = signedOutDb();
    const collections = ["decision_reports", "daily_briefs", "audit_logs"] as const;

    for (const collectionName of collections) {
      await assertFails(getDoc(doc(signedOut, collectionName, "sample")));
      await assertFails(setDoc(doc(signedOut, collectionName, "new"), sampleWrite(collectionName)));
      await assertFails(getDoc(doc(viewer, collectionName, "sample")));
      await assertFails(setDoc(doc(viewer, collectionName, "new"), sampleWrite(collectionName)));
      await assertSucceeds(getDoc(doc(owner, collectionName, "sample")));
      await assertSucceeds(setDoc(doc(owner, collectionName, "new"), sampleWrite(collectionName)));
    }
  });
});
