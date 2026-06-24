import { addDoc, collection, doc, type Firestore, getDoc, serverTimestamp } from "firebase/firestore";
import type { CodexJob, DecisionReport, KnowledgeSop, TaskDispatch } from "@/types/firestore";

type SopDraftInput = {
  title: string;
  category: string;
  projectId?: string | null;
  sourceType: NonNullable<KnowledgeSop["source_type"]>;
  sourceId?: string | null;
  summary: string;
  content: string;
};

async function createSopDraft(db: Firestore, userId: string, input: SopDraftInput) {
  const ref = await addDoc(collection(db, "knowledge_sop"), {
    title: input.title,
    category: input.category,
    project_id: input.projectId ?? "knowledge_sop",
    agent_ids: ["knowledge_ai"],
    summary: input.summary,
    content: input.content,
    rules: ["所有正式動作需 Mark Review", "不自動套用到 AI prompt", "不自動改變外部行為"],
    examples: [],
    forbidden_actions: ["no secrets", "no external actions", "no LINE push", "no payments", "no orders"],
    source_type: input.sourceType,
    source_id: input.sourceId ?? null,
    status: "draft",
    need_mark_review: true,
    review_status: "pending",
    version: 1,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "knowledge_sop.create_draft",
    target_collection: "knowledge_sop",
    target_id: ref.id,
    before: null,
    after: { source_type: input.sourceType, source_id: input.sourceId ?? null, status: "draft" },
    reason: "Created SOP draft only. It is not automatically applied to prompts or external behavior.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { sopId: ref.id };
}

export async function createSopDraftFromTask(db: Firestore, taskId: string, userId: string) {
  const snap = await getDoc(doc(db, "task_dispatches", taskId));
  if (!snap.exists()) throw new Error("Task dispatch not found.");
  const task = { id: snap.id, ...snap.data() } as TaskDispatch;
  return createSopDraft(db, userId, {
    title: `SOP Draft - ${task.title}`,
    category: task.task_type || "task",
    projectId: task.project_id,
    sourceType: "task_dispatch",
    sourceId: task.id,
    summary: task.background || task.title,
    content: `${task.instructions || task.instruction}\n\nCompletion standard: ${task.completion_standard}`
  });
}

export async function createSopDraftFromDecisionReport(db: Firestore, reportId: string, userId: string) {
  const snap = await getDoc(doc(db, "decision_reports", reportId));
  if (!snap.exists()) throw new Error("Decision report not found.");
  const report = { id: snap.id, ...snap.data() } as DecisionReport;
  return createSopDraft(db, userId, {
    title: `SOP Draft - ${report.title}`,
    category: `${report.decision_type}_decision`,
    projectId: report.project_id,
    sourceType: "decision_report",
    sourceId: report.id,
    summary: report.summary,
    content: JSON.stringify({
      assumptions: report.assumptions,
      cost_items: report.cost_items,
      risk_items: report.risk_items,
      stop_loss_conditions: report.stop_loss_conditions,
      recommendation: report.recommendation
    }, null, 2)
  });
}

export async function createSopDraftFromCodexJob(db: Firestore, jobId: string, userId: string) {
  const snap = await getDoc(doc(db, "codex_jobs", jobId));
  if (!snap.exists()) throw new Error("Codex job not found.");
  const job = { id: snap.id, ...snap.data() } as CodexJob;
  const testCommands = Array.isArray(job.test_commands) ? job.test_commands : [];
  const forbiddenActions = Array.isArray(job.forbidden_actions) ? job.forbidden_actions : [];
  return createSopDraft(db, userId, {
    title: `SOP Draft - ${job.title}`,
    category: "codex_job",
    projectId: "body_state_app",
    sourceType: "codex_job",
    sourceId: job.id,
    summary: job.goal,
    content: `${job.instructions ?? ""}\n\nTests: ${testCommands.join(", ")}\nForbidden: ${forbiddenActions.join(", ")}`
  });
}
