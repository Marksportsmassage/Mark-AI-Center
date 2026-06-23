import {
  addDoc,
  collection,
  doc,
  type Firestore,
  getDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

export type TaskReviewAction = "approve" | "reject" | "more_info" | "archive" | "doing" | "done";

export function taskReviewUpdates(action: TaskReviewAction) {
  return action === "approve"
    ? { decision_status: "approved", status: "doing" }
    : action === "reject"
      ? { decision_status: "rejected", status: "archived" }
      : action === "more_info"
        ? { decision_status: "needs_more_info", status: "waiting_mark" }
        : action === "doing"
          ? { status: "doing" }
          : action === "done"
            ? { status: "done" }
            : { status: "archived" };
}

export async function reviewTaskDispatch(db: Firestore, taskId: string, action: TaskReviewAction, userId: string) {
  const updates = taskReviewUpdates(action);
  const taskRef = doc(db, "task_dispatches", taskId);
  const beforeSnap = await getDoc(taskRef);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;

  await updateDoc(taskRef, {
    ...updates,
    updated_at: serverTimestamp()
  });

  const auditDoc = await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: `task_dispatch.${action}`,
    target_collection: "task_dispatches",
    target_id: taskId,
    before,
    after: updates,
    reason: "Mark Review button action. No external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return { updates, auditLogId: auditDoc.id };
}
