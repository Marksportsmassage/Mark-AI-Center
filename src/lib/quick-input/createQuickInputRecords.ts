import {
  addDoc,
  collection,
  doc,
  type Firestore,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import type { AiRouteMode, RouteIntentResult } from "@/lib/ai/routeIntentSchema";
import { reviewDefaults } from "@/lib/safety";

export interface ClassificationResult {
  result: RouteIntentResult | null;
  mode: AiRouteMode;
  error?: string;
  validationFailed?: boolean;
  latency_ms?: number;
  model?: string | null;
  error_code?: string | null;
}

export interface CreateQuickInputRecordsInput {
  db: Firestore;
  userId: string;
  rawText: string;
  source: "web" | "line" | "manual" | "voice";
  classify: (rawText: string, inboxId: string) => Promise<ClassificationResult>;
}

function redactError(error?: string) {
  if (!error) {
    return null;
  }

  return error.replace(/sk-[A-Za-z0-9_-]+/g, "sk-redacted").slice(0, 240);
}

async function writeRouteLog(
  db: Firestore,
  input: CreateQuickInputRecordsInput,
  inboxId: string,
  classification: ClassificationResult,
  startedAt: number
) {
  const route = classification.result;
  const status = route
    ? classification.mode === "fallback"
      ? "fallback_used"
      : "success"
    : classification.validationFailed
      ? "validation_error"
      : classification.error_code === "missing_key"
        ? "missing_key"
        : "api_error";

  const logDoc = await addDoc(collection(db, "ai_route_logs"), {
    user_id: input.userId,
    source: input.source,
    inbox_id: inboxId,
    mode: classification.mode,
    status,
    model: classification.model ?? null,
    latency_ms: classification.latency_ms ?? Date.now() - startedAt,
    input_length: input.rawText.length,
    output_valid: Boolean(route),
    detected_intent: route?.classification.detected_intent ?? null,
    project_id: route?.classification.project_id ?? null,
    agent_ids: route?.classification.agent_ids ?? [],
    confidence: route?.classification.confidence ?? null,
    needs_clarification: route?.classification.needs_clarification ?? null,
    error_code: classification.error_code ?? null,
    error_summary_redacted: redactError(classification.error),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return logDoc.id;
}

export async function createQuickInputRecords(input: CreateQuickInputRecordsInput) {
  const rawText = input.rawText.trim();
  const title = rawText.slice(0, 48);

  const inboxDoc = await addDoc(collection(input.db, "ai_inbox"), {
    user_id: input.userId,
    source: input.source,
    title,
    body: rawText,
    raw_text: rawText,
    normalized_text: rawText,
    priority: "medium",
    status: "new",
    ...reviewDefaults,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  const startedAt = Date.now();
  const classification = await input.classify(rawText, inboxDoc.id);
  const routeLogId = await writeRouteLog(input.db, input, inboxDoc.id, classification, startedAt);

  if (!classification.result) {
    await updateDoc(doc(input.db, "ai_inbox", inboxDoc.id), {
      status: classification.validationFailed ? "ai_error" : "waiting_clarification",
      route_error: redactError(classification.error) ?? "Route-intent failed.",
      route_log_id: routeLogId,
      ai_mode: classification.mode,
      needs_clarification: true,
      clarification_question: "AI 分類失敗，請 Mark 補充或改用 mock mode。",
      updated_at: serverTimestamp()
    });

    return {
      inboxId: inboxDoc.id,
      routeLogId,
      taskId: null,
      mode: classification.mode,
      status: "ai_error" as const
    };
  }

  const route = classification.result;
  const inboxStatus = route.classification.needs_clarification
    ? "waiting_clarification"
    : route.task_dispatch.needed
      ? "converted_to_task"
      : "triaged";

  await updateDoc(doc(input.db, "ai_inbox", inboxDoc.id), {
    title: route.summary.title,
    normalized_text: route.summary.normalized_text,
    detected_intent: route.classification.detected_intent,
    project_id: route.classification.project_id,
    related_project_id: route.classification.project_id,
    agent_ids: route.classification.agent_ids,
    confidence: route.classification.confidence,
    needs_clarification: route.classification.needs_clarification,
    clarification_question: route.classification.clarification_question,
    summary: route.summary.summary,
    next_actions: route.next_actions,
    safety: route.safety,
    priority: route.classification.priority,
    status: inboxStatus,
    ai_mode: classification.mode,
    route_log_id: routeLogId,
    route_error: redactError(classification.error),
    need_mark_review: true,
    updated_at: serverTimestamp()
  });

  let taskId: string | null = null;

  if (route.task_dispatch.needed && !route.classification.needs_clarification) {
    const taskDoc = await addDoc(collection(input.db, "task_dispatches"), {
      source_inbox_id: inboxDoc.id,
      project_id: route.classification.project_id,
      related_project_id: route.classification.project_id,
      agent_ids: route.classification.agent_ids,
      assigned_agent_id: route.classification.agent_ids[0],
      title: route.task_dispatch.title ?? route.summary.title,
      task_type: route.task_dispatch.task_type ?? route.classification.detected_intent,
      background: route.task_dispatch.background ?? rawText,
      instructions: route.task_dispatch.instructions.join("\n"),
      instruction: route.task_dispatch.instructions.join("\n"),
      owner_type: route.task_dispatch.owner_type ?? "mark",
      human_assistant_needed: route.task_dispatch.human_assistant_needed,
      ai_agent_needed: route.task_dispatch.ai_agent_needed,
      codex_needed: route.task_dispatch.codex_needed,
      completion_standard: route.task_dispatch.completion_standard ?? "提供 Mark 可審核的摘要、建議任務、風險與下一步。",
      report_format: route.task_dispatch.report_format ?? "summary / risks / next_actions / mark_review_required",
      priority: route.classification.priority,
      status: "waiting_review",
      need_mark_review: true,
      review_status: "pending",
      capital_required: route.business_decision.capital_required ?? "none",
      expected_roi: route.business_decision.expected_roi ?? "not_estimated",
      payback_period: route.business_decision.payback_period ?? "not_applicable",
      risk_level: route.business_decision.risk_level,
      cashflow_impact: route.business_decision.cashflow_impact ?? "none",
      stage: route.business_decision.stage,
      decision_status: "pending",
      external_action_allowed: false,
      safety_forbidden_reasons: route.safety.forbidden_reasons,
      ai_mode: classification.mode,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    taskId = taskDoc.id;

    await updateDoc(doc(input.db, "ai_inbox", inboxDoc.id), {
      status: "converted_to_task",
      task_dispatch_id: taskId,
      updated_at: serverTimestamp()
    });
  }

  return {
    inboxId: inboxDoc.id,
    routeLogId,
    taskId,
    mode: classification.mode,
    status: inboxStatus
  };
}
