import type { KnowledgeSop } from "@/types/firestore";

type SopSeed = Omit<KnowledgeSop, "id" | "created_at" | "updated_at">;

export const knowledgeSopSeedTemplates: SopSeed[] = [
  ["Mark AI 系統安全總規則", "safety", "core_operations"],
  ["財務決策總規則", "finance_rule", "finance_risk"],
  ["創業資金測試 SOP", "startup_capital", "startup_radar"],
  ["CFO Review SOP", "finance_review", "finance_risk"],
  ["服飾選品評估 SOP", "apparel", "apparel_business"],
  ["一番賞 / 公仔創業 SOP", "ichiban_kuji", "ichiban_kuji_business"],
  ["飲料店創業 SOP", "beverage", "beverage_business"],
  ["資本配置 SOP", "capital_allocation", "capital_compounding"],
  ["學員課表整理 SOP", "client_schedule", "student_schedule"],
  ["國考內容產出 SOP", "study", "final_exam_review"],
  ["Codex Job SOP", "codex_job", "body_state_app"]
].map(([title, category, projectId]) => ({
  title,
  category,
  project_id: projectId,
  agent_ids: ["knowledge_ai"],
  summary: `${title} draft seed. Mark review is required before use.`,
  content: "所有正式動作需 Mark Review；不得自動對外行動；不得寫入或顯示 secret。",
  rules: ["need_mark_review=true", "external_action_allowed=false", "no automatic external behavior"],
  examples: [],
  forbidden_actions: ["no secrets", "no LINE push", "no payments", "no orders", "no supplier contact"],
  source_type: "seed",
  source_id: null,
  status: "draft",
  need_mark_review: true,
  review_status: "pending",
  version: 1
}));
