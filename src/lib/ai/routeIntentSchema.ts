import { z } from "zod";
import { mockRouteIntent } from "@/lib/route-intent";

export const allowedProjectIds = [
  "core_operations",
  "market_daily",
  "final_exam_review",
  "student_schedule",
  "career_strategy",
  "body_state_app",
  "body_state_business_app",
  "brand_content",
  "finance_risk",
  "knowledge_sop",
  "startup_radar",
  "apparel_business",
  "ichiban_kuji_business",
  "beverage_business",
  "capital_compounding"
] as const;

export const allowedAgentIds = [
  "chief_ai",
  "secretary_ai",
  "project_manager_ai",
  "content_ai",
  "client_manager_ai",
  "product_ai",
  "investment_ai",
  "strategy_ai",
  "knowledge_ai",
  "market_intelligence_ai",
  "business_model_ai",
  "cfo_ai",
  "risk_officer_ai",
  "supply_chain_ai",
  "operations_sop_ai",
  "growth_marketing_ai",
  "capital_allocation_ai"
] as const;

export const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const ownerTypeSchema = z.enum(["mark", "human_assistant", "ai_agent", "codex", "external"]);
export const riskLevelSchema = z.enum(["low", "medium", "high", "unknown"]);
export const businessStageSchema = z.enum(["idea", "research", "small_test", "validation", "scale", "paused"]);

export const routeIntentInputSchema = z.object({
  raw_text: z.string().trim().min(1),
  source: z.enum(["web", "line", "manual", "voice"]),
  user_id: z.string().optional()
});

export const routeIntentResultSchema = z
  .object({
    classification: z
      .object({
        detected_intent: z.string().min(1),
        project_id: z.enum(allowedProjectIds),
        agent_ids: z.array(z.enum(allowedAgentIds)).min(1),
        confidence: z.number().min(0).max(1),
        needs_clarification: z.boolean(),
        clarification_question: z.string().nullable(),
        priority: prioritySchema,
        need_mark_review: z.literal(true)
      })
      .strict(),
    summary: z
      .object({
        title: z.string().min(1),
        normalized_text: z.string().min(1),
        summary: z.string().min(1)
      })
      .strict(),
    next_actions: z
      .array(
        z
          .object({
            action: z.string().min(1),
            owner_type: ownerTypeSchema,
            agent_ids: z.array(z.enum(allowedAgentIds)),
            priority: prioritySchema
          })
          .strict()
      )
      .default([]),
    task_dispatch: z
      .object({
        needed: z.boolean(),
        title: z.string().nullable(),
        task_type: z.string().nullable(),
        background: z.string().nullable(),
        instructions: z.array(z.string()),
        completion_standard: z.string().nullable(),
        report_format: z.string().nullable(),
        owner_type: ownerTypeSchema.nullable(),
        human_assistant_needed: z.boolean(),
        ai_agent_needed: z.boolean(),
        codex_needed: z.boolean()
      })
      .strict(),
    business_decision: z
      .object({
        is_business_or_investment_decision: z.boolean(),
        capital_required: z.string().nullable(),
        expected_roi: z.string().nullable(),
        payback_period: z.string().nullable(),
        risk_level: riskLevelSchema,
        cashflow_impact: z.string().nullable(),
        stage: businessStageSchema
      })
      .strict(),
    safety: z
      .object({
        external_action_allowed: z.literal(false),
        requires_mark_approval: z.literal(true),
        forbidden_reasons: z.array(z.string()).min(1)
      })
      .strict()
  })
  .strict();

export type RouteIntentInput = z.infer<typeof routeIntentInputSchema>;
export type RouteIntentResult = z.infer<typeof routeIntentResultSchema>;
export type AiRouteMode = "mock" | "openai" | "fallback";

export function mockRouteIntentStructured(rawText: string): RouteIntentResult {
  const mock = mockRouteIntent(rawText);
  const needsClarification = mock.needs_clarification;
  const isBusinessOrInvestment = ["investment", "startup"].includes(mock.task_type);
  const taskDispatch = mock.task_dispatch;
  const businessDecision = mock.business_decision;

  return {
    classification: {
      detected_intent: mock.detected_intent,
      project_id: mock.project_id as (typeof allowedProjectIds)[number],
      agent_ids: mock.agent_ids as Array<(typeof allowedAgentIds)[number]>,
      confidence: mock.confidence,
      needs_clarification: needsClarification,
      clarification_question: mock.clarification_question ?? null,
      priority: mock.priority,
      need_mark_review: true
    },
    summary: {
      title: mock.summary_title ?? rawText.trim().slice(0, 48) ?? "Untitled input",
      normalized_text: rawText.trim(),
      summary: mock.summary
    },
    next_actions: needsClarification
      ? [
          {
            action: mock.clarification_question ?? "請 Mark 補充分類。",
            owner_type: "mark",
            agent_ids: ["chief_ai", "project_manager_ai"],
            priority: "medium"
          }
        ]
      : (mock.next_actions ?? ["建立待審核任務，等待 Mark review。"]).map((action) => ({
          action,
          owner_type: mock.codex_needed ? "codex" : "ai_agent",
          agent_ids: mock.agent_ids as Array<(typeof allowedAgentIds)[number]>,
          priority: mock.priority
        })),
    task_dispatch: {
      needed: mock.should_create_task,
      title: mock.should_create_task ? (taskDispatch?.title ?? rawText.trim().slice(0, 48)) : null,
      task_type: mock.should_create_task ? (taskDispatch?.task_type ?? mock.task_type) : null,
      background: mock.should_create_task ? (taskDispatch?.background ?? rawText.trim()) : null,
      instructions: mock.should_create_task
        ? (taskDispatch?.instructions ?? ["整理研究、任務拆解、風險與下一步。任何外部行動都必須等待 Mark review。"])
        : [],
      completion_standard: mock.should_create_task
        ? (taskDispatch?.completion_standard ?? "提供 Mark 可審核的摘要、建議任務、風險與下一步。")
        : null,
      report_format: mock.should_create_task
        ? (taskDispatch?.report_format ?? "summary / assigned_agents / risks / next_actions / mark_review_required")
        : null,
      owner_type: mock.should_create_task ? (taskDispatch?.owner_type ?? "mark") : null,
      human_assistant_needed: taskDispatch?.human_assistant_needed ?? false,
      ai_agent_needed: taskDispatch?.ai_agent_needed ?? mock.should_create_task,
      codex_needed: taskDispatch?.codex_needed ?? mock.codex_needed
    },
    business_decision: {
      is_business_or_investment_decision: businessDecision?.is_business_or_investment_decision ?? isBusinessOrInvestment,
      capital_required: businessDecision?.capital_required ?? (isBusinessOrInvestment ? "to_be_estimated" : null),
      expected_roi: businessDecision?.expected_roi ?? (isBusinessOrInvestment ? "to_be_estimated" : null),
      payback_period: businessDecision?.payback_period ?? (isBusinessOrInvestment ? "to_be_estimated" : null),
      risk_level: businessDecision?.risk_level ?? (isBusinessOrInvestment ? "high" : "medium"),
      cashflow_impact: businessDecision?.cashflow_impact ?? (isBusinessOrInvestment ? "needs_review" : null),
      stage: businessDecision?.stage ?? (mock.stage === "idea" || mock.stage === "research" ? mock.stage : "research")
    },
    safety: {
      external_action_allowed: false,
      requires_mark_approval: true,
      forbidden_reasons: mock.safety_forbidden_reasons ?? [
        "不得自動對外傳訊息",
        "不得自動發文",
        "不得刪除資料",
        "不得投資下單",
        "不得醫療診斷或承諾療效"
      ]
    }
  };
}
