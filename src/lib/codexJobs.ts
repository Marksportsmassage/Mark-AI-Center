import { addDoc, collection, doc, type Firestore, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { CodexJob, TaskDispatch } from "@/types/firestore";

export function buildCodexJobDraft(task: TaskDispatch): Omit<CodexJob, "id" | "created_at" | "updated_at"> {
  return {
    source_task_dispatch_id: task.id,
    title: `Codex Job Draft - ${task.title}`,
    goal: task.completion_standard || task.title,
    instructions: task.instructions || task.instruction,
    target_files: [],
    test_commands: ["npm run build"],
    forbidden_actions: ["no secrets", "no external actions", "no LINE push", "no payments", "no deploy"],
    status: "draft",
    needs_mark_review: true,
    need_mark_review: true,
    external_action_allowed: false
  };
}

export async function createCodexJobDraft(db: Firestore, taskId: string, userId: string) {
  const snap = await getDoc(doc(db, "task_dispatches", taskId));
  if (!snap.exists()) throw new Error("Task dispatch not found.");
  const task = { id: snap.id, ...snap.data() } as TaskDispatch;
  const ref = await addDoc(collection(db, "codex_jobs"), {
    ...buildCodexJobDraft(task),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "codex_job.create_draft",
    target_collection: "codex_jobs",
    target_id: ref.id,
    before: null,
    after: { source_task_dispatch_id: taskId, status: "draft", external_action_allowed: false },
    reason: "Created Codex job draft only. No Codex API, PR, deploy, or external task was submitted.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { jobId: ref.id };
}

export async function updateCodexJobStatus(db: Firestore, jobId: string, status: CodexJob["status"], userId: string) {
  const jobRef = doc(db, "codex_jobs", jobId);
  const beforeSnap = await getDoc(jobRef);
  await updateDoc(jobRef, {
    status,
    needs_mark_review: true,
    need_mark_review: true,
    external_action_allowed: false,
    updated_at: serverTimestamp()
  });
  const audit = await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: `codex_job.${status}`,
    target_collection: "codex_jobs",
    target_id: jobId,
    before: beforeSnap.exists() ? beforeSnap.data() : null,
    after: { status, external_action_allowed: false },
    reason: "Updated Codex job draft status only. No Codex API, PR, deploy, or external task was submitted.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { auditLogId: audit.id };
}
