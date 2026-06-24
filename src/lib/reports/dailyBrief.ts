import {
  addDoc,
  collection,
  doc,
  type Firestore,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { FINANCE_RISK_REMINDERS, missingFinancialProfileFields } from "@/lib/finance";
import type { AiInboxItem, DailyBrief, FinanceReview, FinancialProfile, TaskDispatch } from "@/types/firestore";

function titleOf(task: TaskDispatch) {
  return task.title || task.task_type || task.id;
}

function isBusinessTask(task: TaskDispatch) {
  return (
    task.project_id?.includes("business") ||
    task.project_id === "capital_compounding" ||
    task.task_type.includes("startup") ||
    task.task_type.includes("investment") ||
    task.task_type.includes("capital")
  );
}

function toMillis(value: unknown) {
  if (!value) return 0;
  if (typeof value === "string") return Date.parse(value) || 0;
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  return 0;
}

export function buildDailyBriefDraft(input: {
  userId: string;
  dateKey: string;
  inbox: AiInboxItem[];
  tasks: TaskDispatch[];
  financeReviews?: FinanceReview[];
  financialProfile?: FinancialProfile | null;
}): Omit<DailyBrief, "id" | "created_at" | "updated_at"> {
  const waitingReview = input.tasks.filter((task) => task.status === "waiting_review");
  const needsMoreInfo = input.tasks.filter((task) => task.status === "waiting_mark" || task.decision_status === "needs_more_info");
  const activeTasks = input.tasks.filter((task) => ["waiting_review", "waiting_mark", "todo", "doing"].includes(task.status));
  const recentLineInputs = input.inbox.filter((item) => item.source === "line");
  const businessTasks = input.tasks.filter(isBusinessTask);
  const waitingFinance = (input.financeReviews ?? []).filter((review) => review.status === "waiting_review" || review.status === "waiting_mark_input");
  const financeMissing = missingFinancialProfileFields(input.financialProfile ?? null);
  const topPriorities = activeTasks
    .slice()
    .sort((a, b) => Number(b.priority === "urgent" || b.priority === "high") - Number(a.priority === "urgent" || a.priority === "high"))
    .slice(0, 3)
    .map(titleOf);

  return {
    date_key: input.dateKey,
    user_id: input.userId,
    title: `Daily Brief ${input.dateKey}`,
    summary: `今日有 ${waitingReview.length} 件等待 review，${needsMoreInfo.length} 件需要補充資訊，${businessTasks.length} 件商業/資金相關任務，${waitingFinance.length} 件財務 review/補資料。`,
    top_priorities: topPriorities,
    waiting_review_tasks: waitingReview.map(titleOf),
    needs_more_info_tasks: needsMoreInfo.map(titleOf),
    recent_line_inputs: recentLineInputs.slice(0, 8).map((item) => item.raw_text ?? item.summary ?? item.title),
    business_decision_tasks: businessTasks.map(titleOf),
    finance_reminders: [...FINANCE_RISK_REMINDERS, ...financeMissing.map((item) => `Mark 需補：${item}`)],
    suggested_focus: topPriorities.length > 0 ? topPriorities : ["先清空等待 Mark review 的任務", "補齊 Finance Advisor 財務資料"],
    do_not_focus: ["不要自動對外傳訊息", "不要未審核就付款/下單", "不要未完成 CFO review 就加碼創業支出"],
    recommended_sop_updates: businessTasks.slice(0, 3).map((task) => `整理 SOP：${titleOf(task)}`),
    need_mark_review: true,
    review_status: "pending",
    status: "draft"
  };
}

export async function generateTodayBrief(db: Firestore, userId: string, now = new Date()) {
  const dateKey = now.toISOString().slice(0, 10);
  const inboxSnap = await getDocs(query(collection(db, "ai_inbox"), limit(50)));
  const taskSnap = await getDocs(
    query(collection(db, "task_dispatches"), where("status", "in", ["waiting_review", "waiting_mark", "todo", "doing"]), limit(50))
  );
  const financeSnap = await getDocs(
    query(collection(db, "finance_reviews"), where("status", "in", ["waiting_review", "waiting_mark_input"]), limit(30))
  );
  const profileSnap = await getDocs(query(collection(db, "financial_profile"), where("user_id", "==", userId), limit(1)));
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
  const inbox = inboxSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as AiInboxItem)
    .filter((item) => {
      const createdAt = toMillis(item.created_at);
      return createdAt === 0 || createdAt >= cutoff;
    });
  const tasks = taskSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as TaskDispatch);
  const financeReviews = financeSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as FinanceReview);
  const financialProfile = profileSnap.docs[0] ? ({ id: profileSnap.docs[0].id, ...profileSnap.docs[0].data() } as FinancialProfile) : null;
  const draft = buildDailyBriefDraft({ userId, dateKey, inbox, tasks, financeReviews, financialProfile });
  const briefDoc = await addDoc(collection(db, "daily_briefs"), {
    ...draft,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  const auditDoc = await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "daily_brief.generate_today",
    target_collection: "daily_briefs",
    target_id: briefDoc.id,
    before: null,
    after: { date_key: dateKey, status: "draft" },
    reason: "Generated rule-based daily brief. No LINE, push, email, or external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return { briefId: briefDoc.id, auditLogId: auditDoc.id };
}

export async function updateDailyBriefStatus(db: Firestore, briefId: string, status: DailyBrief["status"], userId: string) {
  const briefRef = doc(db, "daily_briefs", briefId);
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: `daily_brief.${status}`,
    target_collection: "daily_briefs",
    target_id: briefId,
    before: null,
    after: { status },
    reason: "Daily brief review action. No external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return briefRef;
}
