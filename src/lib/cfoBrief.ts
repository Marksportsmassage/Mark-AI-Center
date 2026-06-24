import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import { buildTodayDashboardSummary, type TodayDashboardInput } from "@/lib/today";
import type { ReviewQueueItem } from "@/lib/reviewQueue";
import { asArray, displayText } from "@/lib/ui/safe";
import type { CreditCardObligation, DailyBrief, ExpenseSignal, TaskDispatch } from "@/types/firestore";

export interface CfoBriefInput extends TodayDashboardInput {
  userId: string;
  dateKey: string;
}

export function buildCfoBriefDraft(input: CfoBriefInput): Omit<DailyBrief, "id" | "created_at" | "updated_at"> {
  const summary = buildTodayDashboardSummary(input);
  const queueItems = asArray<ReviewQueueItem>(input.reviewQueueItems);
  const expenseSignals = asArray<ExpenseSignal>(input.expenseSignals);
  const creditCards = asArray<CreditCardObligation>(input.creditCardObligations);
  const taskDispatches = asArray<TaskDispatch>(input.taskDispatches);
  const waitingReviewItems = queueItems.slice(0, 20).map((item) => item.title);
  const missingInfoItems = queueItems.filter((item) => item.missing_required_fields.length > 0).slice(0, 20).map((item) => `${item.title}: ${item.missing_required_fields.join("、")}`);
  const highRiskItems = [
    ...queueItems.filter((item) => item.risk_priority >= 3).map((item) => `${item.title}: ${item.risk_level}`),
    ...expenseSignals.filter((item) => item.threshold_status === "warning" || item.threshold_status === "critical").map((item) => `Expense signal ${item.month_key}: ${item.threshold_status}`)
  ].slice(0, 20);
  const financeMissing = input.financialProfile ? asArray<string>(input.financialProfile.missing_required_fields) : ["需要補財務基本資料"];
  const investmentReminders = summary.investment_reminders.length ? summary.investment_reminders : ["沒有投資決策提醒，或尚未建立 investment_decisions。"];
  const cardReminders = creditCards.slice(0, 20).map((item) =>
    `${displayText(item.card_name, "信用卡 / 分期")}：${displayText(item.payment_status)}，月壓力 ${displayText(item.monthly_cashflow_impact ?? item.total_statement_amount, "待補")}`
  );

  return {
    date_key: input.dateKey,
    user_id: input.userId,
    title: `CFO Brief Draft ${input.dateKey}`,
    summary: `今日待審核 ${summary.total_waiting_review} 件，高風險 ${summary.high_risk_count} 件，需要補資料 ${summary.missing_info_count} 件，expense signal ${summary.expense_signal_status}。`,
    top_priorities: summary.top_three.length ? summary.top_three : ["目前沒有高優先待辦，先補財務資料或查看 Review Queue。"],
    waiting_review_tasks: waitingReviewItems,
    needs_more_info_tasks: missingInfoItems,
    recent_line_inputs: [],
    business_decision_tasks: taskDispatches.slice(0, 10).map((item) => item.title),
    finance_reminders: [
      ...(financeMissing.length ? financeMissing.map((item) => `Mark 需補：${item}`) : ["財務基本資料目前無缺漏或尚未讀取到缺漏欄位。"]),
      ...summary.finance_radar.triggered_rules
    ],
    suggested_focus: summary.top_three.length ? summary.top_three : summary.no_cost_next_actions.slice(0, 3),
    do_not_focus: summary.do_not_do_today,
    recommended_sop_updates: ["把今日重複出現的財務審核規則整理成 SOP Draft"],
    waiting_review_items: waitingReviewItems,
    missing_info_items: missingInfoItems,
    high_risk_items: highRiskItems,
    investment_reminders: investmentReminders,
    credit_card_installment_reminders: cardReminders.length ? cardReminders : ["目前沒有信用卡 / 分期提醒，或尚未建立資料。"],
    no_cost_next_actions: summary.no_cost_next_actions,
    need_mark_review: true,
    external_action_allowed: false,
    review_status: "pending",
    status: "draft"
  };
}

export async function createCfoBriefDraft(db: Firestore, input: CfoBriefInput) {
  const draft = buildCfoBriefDraft(input);
  const ref = await addDoc(collection(db, "daily_briefs"), {
    ...draft,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  const audit = await addDoc(collection(db, "audit_logs"), {
    user_id: input.userId,
    action: "cfo_brief.create_draft",
    target_collection: "daily_briefs",
    target_id: ref.id,
    before: null,
    after: { date_key: input.dateKey, status: "draft", external_action_allowed: false },
    reason: "Created rule-based CFO brief draft. No LINE, push, email, OpenAI call, payment, order, or external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { briefId: ref.id, auditLogId: audit.id };
}
