import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import type { AdvisorActionDraft, AdvisorActionType, AdvisorMessage, AdvisorMode, AdvisorThread } from "@/types/firestore";
import type { AdvisorContext } from "@/lib/advisorContext";

export interface AdvisorSuggestedAction {
  action_type: AdvisorActionType;
  title: string;
  summary: string;
  target_collection: string;
  draft_payload: Record<string, unknown>;
}

export interface AdvisorAnswer {
  content: string;
  context_used: string[];
  missing_required_fields: string[];
  safety_flags: string[];
  suggested_actions: AdvisorSuggestedAction[];
  need_mark_review: true;
  external_action_allowed: false;
}

const modeLabels: Record<AdvisorMode, string> = {
  finance: "CFO / 財務",
  investment: "投資決策",
  business: "創業 / 商業模式",
  studio_ops: "工作室營運",
  client: "客戶 / 課表",
  study: "國考 / 學習內容",
  content: "內容行銷",
  product: "App / 產品開發",
  general: "General Command"
};

function safetyFlags(mode: AdvisorMode, question: string) {
  return [
    "external_action_allowed=false",
    "need_mark_review=true",
    ...(mode === "investment" || /買|賣|加碼|停損|股票|投資/i.test(question) ? ["investment_condition_only_no_unconditional_buy_sell"] : []),
    ...(mode === "client" || /疼|痛|診斷|受傷|醫療/i.test(question) ? ["no_medical_diagnosis"] : []),
    "no_secret_output"
  ];
}

function defaultAction(mode: AdvisorMode, question: string): AdvisorSuggestedAction {
  if (mode === "investment") {
    return { action_type: "create_investment_decision", title: "建立投資決策草稿", summary: "補成本、現價、數量、原始理由後再 review。", target_collection: "investment_decisions", draft_payload: { raw_input: question, status: "waiting_mark_input", need_mark_review: true, external_action_allowed: false } };
  }
  if (mode === "client") {
    return { action_type: "create_client_plan", title: "建立客戶課表草稿", summary: "只記錄訓練重點與注意事項，不做醫療診斷。", target_collection: "client_sessions", draft_payload: { raw_input: question, status: "draft", need_mark_review: true, external_action_allowed: false } };
  }
  if (mode === "content" || mode === "study") {
    return { action_type: "create_content_brief", title: "建立內容 / 學習大綱草稿", summary: "整理 topic、outline、素材缺口，不自動發布。", target_collection: "content_drafts", draft_payload: { raw_input: question, status: "draft", need_mark_review: true, external_action_allowed: false } };
  }
  if (mode === "product") {
    return { action_type: "create_product_task", title: "建立產品任務草稿", summary: "整理成 product task draft，不自動開 PR 或 deploy。", target_collection: "product_features", draft_payload: { raw_input: question, status: "draft", need_mark_review: true, external_action_allowed: false } };
  }
  if (mode === "business") {
    return { action_type: "create_task_dispatch", title: "建立商業實驗任務草稿", summary: "定義測試預算、驗證方式與 stop loss，不聯絡供應商。", target_collection: "task_dispatches", draft_payload: { raw_input: question, status: "draft", need_mark_review: true, external_action_allowed: false } };
  }
  return { action_type: "create_finance_decision", title: "建立財務決策草稿", summary: "先補資料並建立 review-gated draft。", target_collection: "finance_decisions", draft_payload: { raw_input: question, status: "waiting_mark_input", need_mark_review: true, external_action_allowed: false } };
}

export function buildAdvisorAnswer(mode: AdvisorMode, question: string, context: AdvisorContext): AdvisorAnswer {
  const missing = Array.from(new Set(context.missing_required_fields.filter(Boolean)));
  const investmentGuard = mode === "investment" ? "投資問題我不會直接說買或賣，只能列條件、風險、停損與需要補的資料。" : "";
  const clientGuard = mode === "client" ? "客戶身體或疼痛描述不做醫療診斷，只建立訓練紀錄、注意事項與回訪草稿。" : "";
  const content = [
    `模式：${modeLabels[mode]}`,
    "1. 目前我能判斷什麼",
    context.facts.length ? context.facts.map((item) => `- ${item}`).join("\n") : "- 目前沒有足夠上下文，只能先整理問題。",
    "2. 缺少什麼資料",
    missing.length ? missing.map((item) => `- ${item}`).join("\n") : "- 暫無明確缺資料，但正式決策仍需 Mark review。",
    "3. 初步建議",
    `- 先把問題整理成 draft，進 /review-queue 審核。${investmentGuard ? `\n- ${investmentGuard}` : ""}${clientGuard ? `\n- ${clientGuard}` : ""}`,
    "4. 風險",
    "- 不做外部動作；不自動付款、下單、交易、發訊息或聯絡供應商。",
    "5. 下一步",
    "- 補齊缺資料；建立 draft；回到 Review Queue 審核。",
    "6. 可以建立哪些 draft",
    `- ${defaultAction(mode, question).title}`
  ].join("\n");
  return {
    content,
    context_used: context.context_used,
    missing_required_fields: missing,
    safety_flags: safetyFlags(mode, question),
    suggested_actions: [defaultAction(mode, question)],
    need_mark_review: true,
    external_action_allowed: false
  };
}

async function audit(db: Firestore, userId: string, action: string, targetCollection: string, targetId: string) {
  await addDoc(collection(db, "audit_logs"), { user_id: userId, action, target_collection: targetCollection, target_id: targetId, before: null, after: { external_action_allowed: false }, reason: "Advisor draft/message only. No external action executed.", created_at: serverTimestamp(), updated_at: serverTimestamp() });
}

export async function createAdvisorThread(db: Firestore, input: Omit<AdvisorThread, "id" | "created_at" | "updated_at">) {
  const ref = await addDoc(collection(db, "advisor_threads"), { ...input, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, input.user_id, "advisor_thread.create", "advisor_threads", ref.id);
  return { threadId: ref.id };
}

export async function createAdvisorMessage(db: Firestore, input: Omit<AdvisorMessage, "id" | "created_at" | "updated_at">) {
  const ref = await addDoc(collection(db, "advisor_messages"), { ...input, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, input.user_id, `advisor_message.${input.role}`, "advisor_messages", ref.id);
  return { messageId: ref.id };
}

export async function createAdvisorActionDraft(db: Firestore, input: Omit<AdvisorActionDraft, "id" | "created_at" | "updated_at">) {
  const ref = await addDoc(collection(db, "advisor_action_drafts"), { ...input, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, input.user_id, "advisor_action_draft.create", "advisor_action_drafts", ref.id);
  return { actionDraftId: ref.id };
}
