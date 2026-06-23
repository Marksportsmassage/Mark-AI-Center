import { addDoc, collection, doc, type Firestore, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { DecisionReport } from "@/types/firestore";

export type DecisionReportAction = "approve" | "archive" | "more_info";

export function decisionReportUpdates(action: DecisionReportAction): Pick<DecisionReport, "status"> {
  return action === "approve" ? { status: "approved" } : action === "archive" ? { status: "archived" } : { status: "waiting_review" };
}

export async function reviewDecisionReport(db: Firestore, reportId: string, action: DecisionReportAction, userId: string) {
  const updates = decisionReportUpdates(action);
  const reportRef = doc(db, "decision_reports", reportId);
  const beforeSnap = await getDoc(reportRef);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;

  await updateDoc(reportRef, {
    ...updates,
    updated_at: serverTimestamp()
  });

  const auditDoc = await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: `decision_report.${action}`,
    target_collection: "decision_reports",
    target_id: reportId,
    before,
    after: updates,
    reason: "Decision report review action. No external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return { updates, auditLogId: auditDoc.id };
}
