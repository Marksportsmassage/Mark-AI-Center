import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import type { BusinessExperiment, ClientProfile, ClientSession, ContentDraft, ContentIdea, ProductFeature, RoadmapItem, StartupTestPlan, StudyNote } from "@/types/firestore";

function lines(value: string) {
  return value.split(/\n|、|,/).map((item) => item.trim()).filter(Boolean);
}

async function audit(db: Firestore, userId: string, action: string, targetCollection: string, targetId: string) {
  await addDoc(collection(db, "audit_logs"), { user_id: userId, action, target_collection: targetCollection, target_id: targetId, before: null, after: { external_action_allowed: false }, reason: "Non-finance operating branch draft only. No external action executed.", created_at: serverTimestamp(), updated_at: serverTimestamp() });
}

async function createDraft(db: Firestore, userId: string, collectionName: string, action: string, payload: Record<string, unknown>) {
  const ref = await addDoc(collection(db, collectionName), { ...payload, user_id: userId, need_mark_review: true, external_action_allowed: false, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, userId, action, collectionName, ref.id);
  return { id: ref.id, collection: collectionName };
}

export function buildClientProfileDraft(userId: string, input: { displayName: string; summary?: string; goals?: string; limitations?: string; focus?: string; risks?: string; next?: string }): Omit<ClientProfile, "id" | "created_at" | "updated_at"> {
  return { user_id: userId, display_name: input.displayName || "未命名客戶", case_summary: input.summary ?? "", goals: lines(input.goals ?? ""), limitations: lines(input.limitations ?? ""), training_focus: lines(input.focus ?? ""), risk_notes: lines(input.risks ?? ""), next_session_focus: input.next ?? "待 Mark 補下一堂重點", status: "draft", need_mark_review: true, external_action_allowed: false };
}

export function buildClientSessionDraft(userId: string, input: { clientId?: string | null; date?: string; notes?: string; exercises?: string; response?: string; nextPlan?: string; caution?: string }): Omit<ClientSession, "id" | "created_at" | "updated_at"> {
  return { user_id: userId, client_id: input.clientId || null, session_date: input.date || new Date().toISOString().slice(0, 10), session_notes: input.notes ?? "", exercises: lines(input.exercises ?? ""), response: input.response ?? "", next_plan: input.nextPlan ?? "待 Mark review，不自動傳訊息", caution_notes: ["非醫療診斷", ...lines(input.caution ?? "")], status: "draft", need_mark_review: true, external_action_allowed: false };
}

export function buildContentDraft(userId: string, input: { title: string; topic?: string; channel?: ContentDraft["channel"]; material?: string }): Omit<ContentDraft, "id" | "created_at" | "updated_at"> {
  return { user_id: userId, title: input.title || "內容草稿", channel: input.channel ?? "ig", topic: input.topic ?? "other", outline: ["hook", "重點 1", "重點 2", "CTA draft"], body: input.material ?? "待 Mark 補素材", no_auto_post: true, status: "draft", need_mark_review: true, external_action_allowed: false };
}

export function buildContentIdea(userId: string, input: { title: string; topic?: ContentIdea["topic"]; summary?: string }): Omit<ContentIdea, "id" | "created_at" | "updated_at"> {
  return { user_id: userId, title: input.title || "內容 idea", topic: input.topic ?? "other", summary: input.summary ?? "", outline: ["問題", "解法", "範例", "行動"], status: "draft", need_mark_review: true, external_action_allowed: false };
}

export function buildStudyNote(userId: string, input: { title: string; topic?: string; source?: string; points?: string }): Omit<StudyNote, "id" | "created_at" | "updated_at"> {
  return { user_id: userId, title: input.title || "國考筆記", topic: input.topic ?? "other", source_material: input.source || null, key_points: lines(input.points ?? ""), missing_required_fields: input.source ? [] : ["source_material"], status: "draft", need_mark_review: true, external_action_allowed: false };
}

export function buildBusinessExperiment(userId: string, input: { title: string; hypothesis?: string; budget?: number | null; expected?: string; validation?: string; stopLoss?: string }): Omit<BusinessExperiment, "id" | "created_at" | "updated_at"> {
  return { user_id: userId, title: input.title || "商業實驗", hypothesis: input.hypothesis ?? "待驗證假設", test_budget: input.budget ?? null, expected_return: input.expected ?? null, validation_method: input.validation ?? "先定義可觀察需求訊號", stop_loss: input.stopLoss || "未達驗證訊號即停止，不加碼", linked_finance_decision_id: null, linked_decision_scenario_id: null, linked_recovery_plan_id: null, status: "draft", need_mark_review: true, external_action_allowed: false };
}

export function buildStartupTestPlan(userId: string, input: { title: string; budget?: number | null; steps?: string; stopLoss?: string }): Omit<StartupTestPlan, "id" | "created_at" | "updated_at"> {
  return { user_id: userId, title: input.title || "Startup test", test_budget: input.budget ?? null, steps: lines(input.steps ?? "定義假設\n小額測試\n收集回饋"), stop_loss: input.stopLoss || "超過預算或無需求訊號即停止", no_supplier_contact: true, no_payment: true, status: "draft", need_mark_review: true, external_action_allowed: false };
}

export function buildProductFeature(userId: string, input: { title: string; value?: string; priority?: ProductFeature["priority"]; risk?: string; codexJobId?: string | null }): Omit<ProductFeature, "id" | "created_at" | "updated_at"> {
  return { user_id: userId, title: input.title || "功能草稿", expected_value: input.value ?? "待補預期價值", priority: input.priority ?? "medium", linked_codex_job_id: input.codexJobId ?? null, risk: input.risk ?? "需 Mark review，不自動 PR/deploy", status: "draft", need_mark_review: true, external_action_allowed: false };
}

export function buildRoadmapItem(userId: string, input: { title: string; area?: string; value?: string; priority?: RoadmapItem["priority"] }): Omit<RoadmapItem, "id" | "created_at" | "updated_at"> {
  return { user_id: userId, title: input.title || "Roadmap item", area: input.area ?? "product", expected_value: input.value ?? "待補", priority: input.priority ?? "medium", status: "draft", need_mark_review: true, external_action_allowed: false };
}

export async function createClientProfileDraft(db: Firestore, userId: string, input: Parameters<typeof buildClientProfileDraft>[1]) {
  return createDraft(db, userId, "client_profiles", "client_profile.create_draft", buildClientProfileDraft(userId, input) as never);
}

export async function createClientSessionDraft(db: Firestore, userId: string, input: Parameters<typeof buildClientSessionDraft>[1]) {
  return createDraft(db, userId, "client_sessions", "client_session.create_draft", buildClientSessionDraft(userId, input) as never);
}

export async function createContentIdeaDraft(db: Firestore, userId: string, input: Parameters<typeof buildContentIdea>[1]) {
  return createDraft(db, userId, "content_ideas", "content_idea.create_draft", buildContentIdea(userId, input) as never);
}

export async function createContentDraft(db: Firestore, userId: string, input: Parameters<typeof buildContentDraft>[1]) {
  return createDraft(db, userId, "content_drafts", "content_draft.create_draft", buildContentDraft(userId, input) as never);
}

export async function createStudyNoteDraft(db: Firestore, userId: string, input: Parameters<typeof buildStudyNote>[1]) {
  return createDraft(db, userId, "study_notes", "study_note.create_draft", buildStudyNote(userId, input) as never);
}

export async function createBusinessExperimentDraft(db: Firestore, userId: string, input: Parameters<typeof buildBusinessExperiment>[1]) {
  return createDraft(db, userId, "business_experiments", "business_experiment.create_draft", buildBusinessExperiment(userId, input) as never);
}

export async function createStartupTestPlanDraft(db: Firestore, userId: string, input: Parameters<typeof buildStartupTestPlan>[1]) {
  return createDraft(db, userId, "startup_test_plans", "startup_test_plan.create_draft", buildStartupTestPlan(userId, input) as never);
}

export async function createProductFeatureDraft(db: Firestore, userId: string, input: Parameters<typeof buildProductFeature>[1]) {
  return createDraft(db, userId, "product_features", "product_feature.create_draft", buildProductFeature(userId, input) as never);
}

export async function createRoadmapItemDraft(db: Firestore, userId: string, input: Parameters<typeof buildRoadmapItem>[1]) {
  return createDraft(db, userId, "roadmap_items", "roadmap_item.create_draft", buildRoadmapItem(userId, input) as never);
}
