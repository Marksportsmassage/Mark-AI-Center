import type { TaskDispatch } from "../src/types/firestore";

export function sampleTask(overrides: Partial<TaskDispatch>): TaskDispatch {
  return {
    id: "task-1",
    source_inbox_id: "inbox-1",
    project_id: "apparel_business",
    agent_ids: ["cfo_ai"],
    title: "Evaluate apparel test",
    task_type: "startup_capital_analysis",
    background: "Need small test",
    instructions: "Estimate without external action",
    owner_type: "ai_agent",
    human_assistant_needed: false,
    ai_agent_needed: true,
    codex_needed: false,
    completion_standard: "Draft only",
    report_format: "summary",
    instruction: "Estimate without external action",
    status: "waiting_review",
    decision_status: "pending",
    priority: "medium",
    capital_required: "needs_mark_input",
    expected_roi: "needs_mark_input",
    payback_period: "needs_mark_input",
    risk_level: "medium",
    cashflow_impact: "needs_review",
    stage: "research",
    external_action_allowed: false,
    need_mark_review: true,
    review_status: "pending",
    created_at: "",
    updated_at: "",
    ...overrides
  };
}

export function buildCapitalAllocationTestTask() {
  return sampleTask({ project_id: "capital_compounding", task_type: "capital_allocation" });
}
