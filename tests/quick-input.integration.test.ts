import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mockRouteIntentStructured } from "../src/lib/ai/routeIntentSchema";
import { createQuickInputRecords } from "../src/lib/quick-input/createQuickInputRecords";
import { generateDecisionReportDraft } from "../src/lib/reports/decisionReport";
import { generateTodayBrief } from "../src/lib/reports/dailyBrief";
import { reviewDecisionReport } from "../src/lib/review/reviewDecisionReport";
import { reviewTaskDispatch, type TaskReviewAction } from "../src/lib/review/reviewTaskDispatch";

const projectId = "mark-ai-center-integration-test";
const ownerUid = "owner-user";
const viewerUid = "viewer-user";

let testEnv: RulesTestEnvironment;

const sampleInputs = [
  "請用 Codex 開發身境 App 的任務管理功能",
  "整理今天台股大盤與我目前持股的投資風險",
  "評估我如果想做服飾選品，初期應該投入多少測試資金",
  "幫我整理期末考試課程內容總整理",
  "學員謝玉華下次課表要整理左側穩定和肩膀活動度"
];

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
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

function ownerDb() {
  return testEnv.authenticatedContext(ownerUid).firestore();
}

function viewerDb() {
  return testEnv.authenticatedContext(viewerUid).firestore();
}

function signedOutDb() {
  return testEnv.unauthenticatedContext().firestore();
}

async function countCollection(db: ReturnType<typeof ownerDb>, collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.size;
}

describe("Quick Input integration flow", () => {
  it("creates ai_inbox, task_dispatches, and ai_route_logs for classifiable owner inputs", async () => {
    const db = ownerDb();

    for (const rawText of sampleInputs) {
      const result = await createQuickInputRecords({
        db,
        userId: ownerUid,
        rawText,
        source: "web",
        classify: async (text) => ({
          result: mockRouteIntentStructured(text),
          mode: "mock",
          model: "mock",
          latency_ms: 1
        })
      });

      expect(result.inboxId).toBeTruthy();
      expect(result.taskId).toBeTruthy();
      expect(result.routeLogId).toBeTruthy();
    }

    expect(await countCollection(db, "ai_inbox")).toBe(sampleInputs.length);
    expect(await countCollection(db, "task_dispatches")).toBe(sampleInputs.length);
    expect(await countCollection(db, "ai_route_logs")).toBe(sampleInputs.length);
  });

  it("does not create a formal task for needs_clarification input", async () => {
    const db = ownerDb();
    const result = await createQuickInputRecords({
      db,
      userId: ownerUid,
      rawText: "這個之後可以做",
      source: "web",
      classify: async (text) => ({
        result: mockRouteIntentStructured(text),
        mode: "mock",
        model: "mock",
        latency_ms: 1
      })
    });

    expect(result.taskId).toBeNull();
    expect(result.status).toBe("waiting_clarification");
    expect(await countCollection(db, "ai_inbox")).toBe(1);
    expect(await countCollection(db, "task_dispatches")).toBe(0);
    expect(await countCollection(db, "ai_route_logs")).toBe(1);
  });

  it.each([
    ["請幫我評估服飾選品，初期測試資金要抓多少", "apparel_business"],
    ["我想評估一番賞直播抽獎創業成本", "ichiban_kuji_business"],
    ["我想評估飲料店初期成本和損益平衡", "beverage_business"],
    ["我想知道資金要放股票還是創業測試", "capital_compounding"]
  ])("creates task_dispatch for startup/capital mock input: %s", async (rawText, projectId) => {
    const db = ownerDb();
    const result = await createQuickInputRecords({
      db,
      userId: ownerUid,
      rawText,
      source: "web",
      classify: async (text) => ({
        result: mockRouteIntentStructured(text),
        mode: "mock",
        model: "mock",
        latency_ms: 1
      })
    });

    expect(result.taskId).toBeTruthy();
    expect(result.status).toBe("converted_to_task");

    const taskSnapshot = await getDocs(collection(db, "task_dispatches"));
    expect(taskSnapshot.size).toBe(1);
    const task = taskSnapshot.docs[0].data();
    expect(task.project_id).toBe(projectId);
    expect(task.need_mark_review).toBe(true);
    expect(task.decision_status).toBe("pending");
    expect(task.status).toBe("waiting_review");
    expect(task.external_action_allowed).toBe(false);
  });

  it("writes detailed apparel startup task fields from mock classifier", async () => {
    const db = ownerDb();
    const result = await createQuickInputRecords({
      db,
      userId: ownerUid,
      rawText: "請幫我評估服飾選品，初期測試資金要抓多少",
      source: "web",
      classify: async (text) => ({
        result: mockRouteIntentStructured(text),
        mode: "mock",
        model: "mock",
        latency_ms: 1
      })
    });

    expect(result.taskId).toBeTruthy();

    const taskSnapshot = await getDocs(collection(db, "task_dispatches"));
    const task = taskSnapshot.docs[0].data();
    expect(task.title).toBe("評估服飾選品創業初期測試資金");
    expect(task.task_type).toBe("startup_capital_analysis");
    expect(task.owner_type).toBe("ai_agent");
    expect(task.risk_level).toBe("medium");
    expect(task.safety_forbidden_reasons).toContain("不得自動進貨");
  });

  it("writes audit_logs for review actions", async () => {
    const db = ownerDb();
    const result = await createQuickInputRecords({
      db,
      userId: ownerUid,
      rawText: "請用 Codex 開發身境 App 的任務管理功能",
      source: "web",
      classify: async (text) => ({
        result: mockRouteIntentStructured(text),
        mode: "mock",
        model: "mock",
        latency_ms: 1
      })
    });

    expect(result.taskId).toBeTruthy();

    const actions: TaskReviewAction[] = ["approve", "reject", "more_info", "archive"];

    for (const action of actions) {
      await reviewTaskDispatch(db, result.taskId as string, action, ownerUid);
    }

    const auditSnapshot = await getDocs(query(collection(db, "audit_logs"), where("target_id", "==", result.taskId)));
    expect(auditSnapshot.size).toBe(4);
  });

  it("owner can read task detail data and missing source inbox/agents do not block reads", async () => {
    const db = ownerDb();
    await setDoc(doc(db, "task_dispatches", "manual-task"), {
      id: "manual-task",
      title: "Manual task",
      source_inbox_id: "missing-inbox",
      agent_ids: ["missing_agent"],
      task_type: "startup",
      background: "No linked inbox",
      instructions: "Check missing links",
      instruction: "Check missing links",
      completion_standard: "Review safely",
      report_format: "summary",
      owner_type: "ai_agent",
      human_assistant_needed: false,
      ai_agent_needed: true,
      codex_needed: false,
      status: "waiting_review",
      decision_status: "pending",
      priority: "medium",
      stage: "research",
      need_mark_review: true,
      review_status: "pending",
      external_action_allowed: false
    });

    const taskSnap = await getDoc(doc(db, "task_dispatches", "manual-task"));
    const inboxSnap = await getDoc(doc(db, "ai_inbox", "missing-inbox"));
    const agentSnap = await getDoc(doc(db, "ai_agents", "missing_agent"));

    expect(taskSnap.exists()).toBe(true);
    expect(inboxSnap.exists()).toBe(false);
    expect(agentSnap.exists()).toBe(false);

    await reviewTaskDispatch(db, "manual-task", "doing", ownerUid);
    await reviewTaskDispatch(db, "manual-task", "done", ownerUid);
    const auditSnapshot = await getDocs(query(collection(db, "audit_logs"), where("target_id", "==", "manual-task")));
    expect(auditSnapshot.size).toBe(2);
  });

  it("generates apparel decision report draft with required cost and risk items", async () => {
    const db = ownerDb();
    const result = await createQuickInputRecords({
      db,
      userId: ownerUid,
      rawText: "請幫我評估服飾選品，初期測試資金要抓多少",
      source: "web",
      classify: async (text) => ({
        result: mockRouteIntentStructured(text),
        mode: "mock",
        model: "mock",
        latency_ms: 1
      })
    });

    const report = await generateDecisionReportDraft(db, result.taskId as string, ownerUid);
    const reportSnap = await getDoc(doc(db, "decision_reports", report.reportId));
    const data = reportSnap.data();

    expect(reportSnap.exists()).toBe(true);
    expect(data?.status).toBe("draft");
    expect(data?.need_mark_review).toBe(true);
    expect(data?.recommendation).toBe("small_test");
    expect(data?.cost_items.map((item: { name: string }) => item.name)).toContain("進貨成本");
    expect(data?.cost_items.map((item: { name: string }) => item.name)).toContain("退換貨預備金");
    expect(data?.risk_items.map((item: { risk: string }) => item.risk)).toContain("庫存滯銷");

    await reviewDecisionReport(db, report.reportId, "approve", ownerUid);
    const auditSnapshot = await getDocs(query(collection(db, "audit_logs"), where("target_id", "==", report.reportId)));
    expect(auditSnapshot.size).toBe(2);
  });

  it("generates daily brief with waiting review tasks and recent LINE inputs", async () => {
    const db = ownerDb();
    await createQuickInputRecords({
      db,
      userId: ownerUid,
      rawText: "請幫我評估服飾選品，初期測試資金要抓多少",
      source: "line",
      classify: async (text) => ({
        result: mockRouteIntentStructured(text),
        mode: "mock",
        model: "mock",
        latency_ms: 1
      })
    });

    const brief = await generateTodayBrief(db, ownerUid, new Date("2026-06-23T08:00:00.000Z"));
    const briefSnap = await getDoc(doc(db, "daily_briefs", brief.briefId));
    const data = briefSnap.data();

    expect(briefSnap.exists()).toBe(true);
    expect(data?.status).toBe("draft");
    expect(data?.need_mark_review).toBe(true);
    expect(data?.waiting_review_tasks.length).toBeGreaterThan(0);
    expect(data?.recent_line_inputs.length).toBeGreaterThan(0);
    expect(data?.business_decision_tasks.length).toBeGreaterThan(0);
    expect(data?.do_not_focus).toContain("不要自動對外傳訊息");
  });

  it("denies non-owner writes", async () => {
    const db = viewerDb();

    await assertFails(
      createQuickInputRecords({
        db,
        userId: viewerUid,
        rawText: "請用 Codex 開發身境 App 的任務管理功能",
        source: "web",
        classify: async (text) => ({
          result: mockRouteIntentStructured(text),
          mode: "mock",
          model: "mock",
          latency_ms: 1
        })
      })
    );
  });

  it("denies signed-out writes", async () => {
    const db = signedOutDb();

    await assertFails(
      createQuickInputRecords({
        db,
        userId: "signed-out",
        rawText: "請用 Codex 開發身境 App 的任務管理功能",
        source: "web",
        classify: async (text) => ({
          result: mockRouteIntentStructured(text),
          mode: "mock",
          model: "mock",
          latency_ms: 1
        })
      })
    );
  });
});
