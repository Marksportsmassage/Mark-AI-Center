export type ReviewStatus = "pending" | "approved" | "rejected" | "needs_revision";
export type Priority = "low" | "medium" | "high" | "urgent";
export type ProjectStatus = "planning" | "active" | "paused" | "completed";
export type TaskStatus =
  | "todo"
  | "doing"
  | "waiting_review"
  | "waiting_mark"
  | "archived"
  | "queued"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";
export type DecisionStatus = "pending" | "approved" | "rejected" | "needs_more_info";
export type TaskStage = "idea" | "research" | "small_test" | "validation" | "scale" | "paused" | "execution" | "review";
export type RiskLevel = "low" | "medium" | "high" | "unknown";
export type DecisionType = "startup" | "investment" | "app" | "finance" | "operations" | "study" | "client" | "other";
export type DecisionRecommendation = "research" | "small_test" | "pause" | "reject" | "needs_more_info";
export type ProjectCategory =
  | "core"
  | "investment"
  | "study"
  | "client"
  | "strategy"
  | "product"
  | "saas"
  | "content"
  | "finance"
  | "knowledge"
  | "startup"
  | "capital";
export type AgentRole =
  | "chief_of_staff"
  | "product_manager"
  | "engineer"
  | "growth"
  | "finance"
  | "research"
  | "ops";

export interface FirestoreBase {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Reviewable {
  need_mark_review: boolean;
  review_status: ReviewStatus;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface UserProfile extends FirestoreBase {
  uid?: string;
  display_name: string;
  email: string;
  role: "owner" | "admin";
  status: "active" | "inactive";
  timezone: string;
}

export interface Project extends FirestoreBase, Reviewable {
  name: string;
  description: string;
  category: ProjectCategory;
  default_agent_ids: string[];
  status: ProjectStatus;
  owner_user_id: string;
  priority: Priority;
  tags: string[];
  next_action: string;
}

export interface AiAgent extends FirestoreBase, Reviewable {
  name: string;
  role: AgentRole | string;
  mission: string;
  responsibilities: string[];
  default_projects: string[];
  status: "active" | "paused";
  allowed_actions: string[];
  blocked_actions: string[];
  forbidden_actions: string[];
  escalation_rules: string[];
}

export interface AiInboxItem extends FirestoreBase, Reviewable {
  user_id?: string;
  source: "manual" | "web" | "line" | "voice" | "system" | "email" | "app";
  title: string;
  body: string;
  raw_text?: string;
  normalized_text?: string;
  detected_intent?: string;
  project_id?: string;
  agent_ids?: string[];
  confidence?: number;
  needs_clarification?: boolean;
  clarification_question?: string;
  summary?: string;
  next_actions?: Array<Record<string, unknown>>;
  safety?: Record<string, unknown>;
  priority: Priority;
  suggested_agent_id?: string;
  related_project_id?: string;
  ai_mode?: "mock" | "openai" | "fallback";
  route_error?: string;
  status: "new" | "triaged" | "converted_to_task" | "waiting_clarification" | "ai_error" | "archived";
  task_dispatch_id?: string;
}

export interface TaskDispatch extends FirestoreBase, Reviewable {
  source_inbox_id?: string;
  project_id?: string;
  agent_ids: string[];
  title: string;
  task_type: string;
  background: string;
  instructions: string;
  owner_type: "mark" | "ai_agent" | "human_assistant" | "codex" | "external";
  human_assistant_needed: boolean;
  ai_agent_needed: boolean;
  codex_needed: boolean;
  completion_standard: string;
  report_format: string;
  instruction: string;
  status: TaskStatus;
  decision_status: DecisionStatus;
  priority: Priority;
  assigned_agent_id?: string;
  related_project_id?: string;
  capital_required?: string;
  expected_roi?: string;
  payback_period?: string;
  risk_level?: RiskLevel;
  cashflow_impact?: string;
  stage: TaskStage;
  external_action_allowed?: boolean;
  safety_forbidden_reasons?: string[];
  due_at?: string;
}

export interface DailyBrief extends FirestoreBase, Reviewable {
  brief_date?: string;
  date_key: string;
  user_id: string;
  title: string;
  summary: string;
  wins?: string[];
  risks?: string[];
  focus_items?: string[];
  top_priorities: string[];
  waiting_review_tasks: string[];
  needs_more_info_tasks: string[];
  recent_line_inputs: string[];
  business_decision_tasks: string[];
  suggested_focus: string[];
  do_not_focus: string[];
  status: "draft" | "reviewed" | "archived";
}

export interface LineEvent extends FirestoreBase, Reviewable {
  event_id: string;
  source_type?: string;
  line_user_id_hash?: string;
  line_user_id_last4?: string;
  source_user_id_hash?: string;
  event_type: string;
  raw_event_redacted: Record<string, unknown>;
  message_type?: string;
  message_text?: string | null;
  message_text_length?: number;
  signature_verified?: boolean;
  allowed_user?: boolean;
  processed_to_inbox?: boolean;
  inbox_id?: string;
  route_log_id?: string;
  status?:
    | "received"
    | "rejected_invalid_signature"
    | "rejected_unauthorized_user"
    | "waiting_owner_link"
    | "processed"
    | "unsupported_message_type"
    | "duplicate_ignored"
    | "error";
  reply_sent?: boolean;
  reply_status?:
    | "not_enabled"
    | "sent"
    | "skipped_unauthorized"
    | "skipped_missing_token"
    | "skipped_error"
    | "skipped_non_text"
    | "duplicate_ignored";
  reply_mode?: "disabled" | "enabled_ack_only";
  duplicate_ignored?: boolean;
  error_summary_redacted?: string | null;
  processed: boolean;
}

export interface LineUser extends FirestoreBase {
  line_user_id_hash: string;
  line_user_id_last4: string;
  status: "pending" | "allowed" | "blocked";
  label?: string;
  first_seen_at?: string;
  last_seen_at?: string;
  event_count?: number;
  approved?: boolean;
}

export interface DecisionReport extends FirestoreBase, Reviewable {
  source_task_dispatch_id?: string;
  project_id?: string;
  title: string;
  context?: string;
  options?: string[];
  risks?: string[];
  decision_type: DecisionType;
  summary: string;
  capital_required_min: number | null;
  capital_required_max: number | null;
  expected_roi_summary: string | null;
  payback_period_summary: string | null;
  risk_level: RiskLevel;
  cashflow_impact: string | null;
  stage: TaskStage | "small_test";
  assumptions: string[];
  cost_items: Array<{
    name: string;
    description: string;
    estimated_min: number | null;
    estimated_max: number | null;
    required: boolean;
  }>;
  allocation_items?: Array<{
    name: string;
    description: string;
    estimated_min: number | null;
    estimated_max: number | null;
    required: boolean;
  }>;
  risk_items: Array<{
    risk: string;
    level: RiskLevel;
    mitigation: string;
  }>;
  next_steps: string[];
  stop_loss_conditions: string[];
  recommendation: DecisionRecommendation;
  status: "draft" | "waiting_review" | "approved" | "archived";
}

export interface CapitalAllocation extends FirestoreBase, Reviewable {
  title: string;
  category: "cash" | "business" | "investment_watch" | "expense" | "reserve";
  amount_twd?: number;
  thesis: string;
  risk_level: Priority;
  action_required: string;
  no_auto_trade: true;
}

export interface StartupAnalysis extends FirestoreBase, Reviewable {
  opportunity_name: string;
  market: string;
  hypothesis: string;
  evidence: string[];
  next_validation_step: string;
  score: number;
}

export interface KnowledgeSop extends FirestoreBase, Reviewable {
  title: string;
  domain: "operations" | "product" | "growth" | "finance" | "safety" | "engineering";
  content: string;
  version: number;
}

export interface AuditLog extends FirestoreBase {
  user_id: string;
  action: string;
  target_collection: string;
  target_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string;
}

export interface AiRouteLog extends FirestoreBase {
  user_id: string;
  source: "web" | "line" | "manual" | "voice";
  inbox_id: string;
  mode: "mock" | "openai" | "fallback";
  status: "success" | "fallback_used" | "validation_error" | "api_error" | "missing_key";
  model: string | null;
  latency_ms: number;
  input_length: number;
  output_valid: boolean;
  detected_intent: string | null;
  project_id: string | null;
  agent_ids: string[];
  confidence: number | null;
  needs_clarification: boolean | null;
  error_code: string | null;
  error_summary_redacted: string | null;
}

export interface FirestoreCollections {
  users: UserProfile;
  projects: Project;
  ai_agents: AiAgent;
  ai_inbox: AiInboxItem;
  task_dispatches: TaskDispatch;
  daily_briefs: DailyBrief;
  line_events: LineEvent;
  line_users: LineUser;
  decision_reports: DecisionReport;
  capital_allocations: CapitalAllocation;
  startup_analyses: StartupAnalysis;
  knowledge_sop: KnowledgeSop;
  settings: Record<string, unknown>;
  audit_logs: AuditLog;
  ai_route_logs: AiRouteLog;
}

export const collectionNames = [
  "users",
  "projects",
  "ai_agents",
  "ai_inbox",
  "task_dispatches",
  "daily_briefs",
  "line_events",
  "line_users",
  "decision_reports",
  "capital_allocations",
  "startup_analyses",
  "knowledge_sop",
  "settings",
  "audit_logs",
  "ai_route_logs"
] as const;

export type CollectionName = (typeof collectionNames)[number];
