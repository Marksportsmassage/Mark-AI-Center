import { phase2Agents, phase2Projects } from "./phase2-seed-data";
import type { AiInboxItem, TaskDispatch } from "../types/firestore";

const now = new Date().toISOString();

export const demoProjects = phase2Projects.slice(0, 2);
export const demoAgents = phase2Agents.slice(0, 3);

export const demoInbox: AiInboxItem[] = [
  {
    id: "demo-inbox",
    user_id: "demo",
    source: "web",
    title: "Demo inbox item",
    body: "Firestore 尚未載入時的開發用資料。",
    raw_text: "Firestore 尚未載入時的開發用資料。",
    normalized_text: "Firestore 尚未載入時的開發用資料。",
    detected_intent: "core_operations",
    project_id: "core_operations",
    agent_ids: ["chief_ai"],
    confidence: 0.5,
    needs_clarification: false,
    summary: "Demo inbox item",
    priority: "medium",
    status: "new",
    need_mark_review: true,
    review_status: "pending",
    created_at: now,
    updated_at: now
  }
];

export const demoTasks: TaskDispatch[] = [
  {
    id: "demo-task",
    source_inbox_id: "demo-inbox",
    project_id: "core_operations",
    agent_ids: ["chief_ai"],
    title: "Demo task",
    task_type: "core_operations",
    background: "Firestore 尚未載入時的開發用資料。",
    instructions: "Run seed to create real task dispatches.",
    instruction: "Run seed to create real task dispatches.",
    owner_type: "mark",
    human_assistant_needed: false,
    ai_agent_needed: true,
    codex_needed: false,
    completion_standard: "Demo only.",
    report_format: "Short summary.",
    priority: "medium",
    status: "todo",
    decision_status: "pending",
    need_mark_review: true,
    review_status: "pending",
    stage: "research",
    created_at: now,
    updated_at: now
  }
];
