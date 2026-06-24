import {
  addDoc,
  collection,
  doc,
  type Firestore,
  getDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import type { CapitalAllocationStatus, FinanceReviewStatus, FinancialProfile } from "@/types/firestore";

export type CapitalAllocationAction = "approve" | "reject" | "more_info" | "archive";
export type FinanceReviewAction = "approve" | "more_info" | "archive";

export function parseNullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Financial profile numbers must be non-negative.");
  }
  return parsed;
}

function capitalStatus(action: CapitalAllocationAction): CapitalAllocationStatus {
  if (action === "approve") return "approved";
  if (action === "reject") return "rejected";
  if (action === "more_info") return "needs_more_info";
  return "rejected";
}

function financeStatus(action: FinanceReviewAction): FinanceReviewStatus {
  if (action === "approve") return "approved";
  if (action === "more_info") return "waiting_mark_input";
  return "archived";
}

export async function updateFinancialProfile(
  db: Firestore,
  profileId: string,
  userId: string,
  updates: Partial<FinancialProfile>
) {
  const profileRef = doc(db, "financial_profile", profileId);
  const beforeSnap = await getDoc(profileRef);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;
  const missingRequiredFields = [
    "current_cash_available",
    "monthly_living_expense",
    "monthly_fixed_costs",
    "safety_cash_reserve_target",
    "current_investment_value",
    "capital_deployment_limit"
  ].filter((field) => updates[field as keyof FinancialProfile] === null || updates[field as keyof FinancialProfile] === undefined);
  const after = {
    ...updates,
    user_id: userId,
    missing_required_fields: missingRequiredFields,
    need_mark_review: true,
    review_status: "pending",
    status: missingRequiredFields.length ? "waiting_mark_input" : "draft",
    updated_at: serverTimestamp()
  };

  await updateDoc(profileRef, after);
  const audit = await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "financial_profile.update",
    target_collection: "financial_profile",
    target_id: profileId,
    before,
    after: { ...updates, missing_required_fields: missingRequiredFields, status: after.status },
    reason: "Updated review-gated financial profile. No allocation approval or external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { auditLogId: audit.id };
}

export async function reviewCapitalAllocation(db: Firestore, allocationId: string, action: CapitalAllocationAction, userId: string) {
  const allocationRef = doc(db, "capital_allocations", allocationId);
  const beforeSnap = await getDoc(allocationRef);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;
  const updates = {
    decision_status: capitalStatus(action),
    need_mark_review: true,
    external_action_allowed: false,
    updated_at: serverTimestamp()
  };
  await updateDoc(allocationRef, updates);
  const audit = await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: `capital_allocation.${action}`,
    target_collection: "capital_allocations",
    target_id: allocationId,
    before,
    after: { decision_status: updates.decision_status, external_action_allowed: false },
    reason: "Capital allocation review action. No payment, transfer, trade, order, or startup execution occurred.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { auditLogId: audit.id };
}

export async function reviewFinanceReview(db: Firestore, reviewId: string, action: FinanceReviewAction, userId: string) {
  const reviewRef = doc(db, "finance_reviews", reviewId);
  const beforeSnap = await getDoc(reviewRef);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;
  const updates = {
    status: financeStatus(action),
    need_mark_review: true,
    external_action_allowed: false,
    updated_at: serverTimestamp()
  };
  await updateDoc(reviewRef, updates);
  const audit = await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: `finance_review.${action}`,
    target_collection: "finance_reviews",
    target_id: reviewId,
    before,
    after: { status: updates.status, external_action_allowed: false },
    reason: "Finance review action. No external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { auditLogId: audit.id };
}
