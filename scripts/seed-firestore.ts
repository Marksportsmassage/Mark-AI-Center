import { adminDb } from "../src/lib/firebase/admin";
import { knowledgeSopSeedTemplates } from "../src/lib/knowledgeSeeds";
import { reviewDefaults } from "../src/lib/safety";
import { phase2Agents, phase2Projects } from "../src/lib/phase2-seed-data";
import type {
  CapitalAllocation,
  DailyBrief,
  DecisionReport,
  FinancialProfile,
  TaskDispatch,
  KnowledgeSop,
  LineEvent,
  AiInboxItem,
  StartupAnalysis,
  UserProfile
} from "../src/types/firestore";

const now = new Date().toISOString();

const users: UserProfile[] = [
  {
    id: "mark",
    display_name: "Mark",
    email: "mark@example.com",
    role: "owner",
    status: "active",
    timezone: "Asia/Taipei",
    created_at: now,
    updated_at: now
  }
];

const aiInbox: AiInboxItem[] = [
  {
    id: "inbox-phase2-welcome",
    user_id: "mark",
    source: "web",
    title: "Phase 2 Quick Input 範例",
    body: "測試 App 開發任務：請整理身境 App 下一步功能。",
    raw_text: "測試 App 開發任務：請整理身境 App 下一步功能。",
    normalized_text: "測試 App 開發任務：請整理身境 App 下一步功能。",
    detected_intent: "app_development",
    project_id: "body_state_app",
    agent_ids: ["product_ai", "project_manager_ai"],
    confidence: 0.86,
    needs_clarification: false,
    summary: "建立 Phase 2 Quick Input 的示範資料。",
    priority: "medium",
    related_project_id: "body_state_app",
    status: "new",
    ...reviewDefaults,
    created_at: now,
    updated_at: now
  }
];

const taskDispatches: TaskDispatch[] = [
  {
    id: "task-phase2-app-review",
    source_inbox_id: "inbox-phase2-welcome",
    project_id: "body_state_app",
    agent_ids: ["product_ai", "project_manager_ai"],
    title: "整理身境 App 下一步功能",
    task_type: "app_development",
    background: "Phase 2 seed 建立的示範任務。",
    instructions: "整理身境 App 管理後台、AI Inbox、任務指派與 Mark Review 的下一步。",
    instruction: "整理身境 App 管理後台、AI Inbox、任務指派與 Mark Review 的下一步。",
    owner_type: "mark",
    human_assistant_needed: false,
    ai_agent_needed: true,
    codex_needed: true,
    completion_standard: "產出可審核的下一步任務清單。",
    report_format: "條列 summary、risks、next actions。",
    priority: "high",
    status: "todo",
    decision_status: "pending",
    related_project_id: "body_state_app",
    need_mark_review: true,
    review_status: "pending",
    capital_required: "none",
    expected_roi: "not_estimated",
    payback_period: "not_applicable",
    risk_level: "medium",
    cashflow_impact: "none",
    stage: "idea",
    created_at: now,
    updated_at: now
  }
];

const dailyBriefs: DailyBrief[] = [
  {
    id: "brief-today",
    brief_date: now.slice(0, 10),
    date_key: now.slice(0, 10),
    user_id: "mark-owner-placeholder",
    title: `Daily Brief ${now.slice(0, 10)}`,
    summary: "第一階段建立 AI Command Center 基礎系統。",
    wins: ["Next.js shell", "Firestore contracts", "Review-first safety model"],
    risks: ["尚未串 LINE token", "尚未串 OpenAI"],
    focus_items: ["確認 Firebase web config", "啟用 Auth provider", "跑 seed"],
    top_priorities: ["確認 Firebase web config", "啟用 Auth provider", "跑 seed"],
    waiting_review_tasks: ["身境 App 任務收件箱"],
    needs_more_info_tasks: [],
    recent_line_inputs: [],
    business_decision_tasks: [],
    suggested_focus: ["先讓 owner-only 後台穩定"],
    do_not_focus: ["不要自動對外傳訊息", "不要未審核就執行外部動作"],
    status: "draft",
    ...reviewDefaults,
    created_at: now,
    updated_at: now
  }
];

const lineEvents: LineEvent[] = [
  {
    id: "line-event-placeholder",
    event_id: "placeholder",
    source_user_id_hash: "redacted",
    event_type: "message",
    raw_event_redacted: { note: "Placeholder only. No LINE token connected in phase 1." },
    processed: false,
    ...reviewDefaults,
    created_at: now,
    updated_at: now
  }
];

const decisionReports: DecisionReport[] = [
  {
    id: "decision-next-phase",
    source_task_dispatch_id: "task-body-state-app",
    project_id: "body_state_app",
    title: "下一階段整合順序",
    context: "需要決定先串 LINE webhook、OpenAI structured output，或先補 Auth gate。",
    options: ["LINE first", "OpenAI first", "Auth and rules first"],
    recommendation: "research",
    risks: ["未設好權限前接 webhook 會增加資料暴露風險"],
    decision_type: "app",
    summary: "先完成 Auth gate 與 Firestore rules，再接 LINE webhook 和 AI parsing。",
    capital_required_min: null,
    capital_required_max: null,
    expected_roi_summary: null,
    payback_period_summary: null,
    risk_level: "medium",
    cashflow_impact: null,
    stage: "research",
    assumptions: ["仍需 Mark review。"],
    cost_items: [],
    risk_items: [{ risk: "權限未完成前串接外部 webhook", level: "medium", mitigation: "先完成 owner-only rules。" }],
    next_steps: ["確認 Auth gate", "部署 Firestore rules", "再接 LINE webhook"],
    stop_loss_conditions: ["任何權限不清楚時暫停外部整合"],
    status: "draft",
    ...reviewDefaults,
    created_at: now,
    updated_at: now
  }
];

const capitalAllocations: CapitalAllocation[] = [
  {
    id: "capital-safety-template",
    title: "資本配置檢查模板",
    category: "reserve",
    thesis: "只建立 review 與情境分析，不自動下單。",
    risk_level: "medium",
    action_required: "Mark review required before any real-world action.",
    no_auto_trade: true,
    ...reviewDefaults,
    created_at: now,
    updated_at: now
  }
];

const financialProfile: FinancialProfile[] = [
  {
    id: "mark-financial-profile-draft",
    user_id: "mark-owner-placeholder",
    monthly_living_expense: null,
    safety_cash_reserve_target: null,
    current_cash_available: null,
    current_investment_value: null,
    current_debt_summary: null,
    monthly_income_estimate: null,
    monthly_fixed_costs: null,
    risk_tolerance: null,
    capital_deployment_limit: null,
    notes: null,
    missing_required_fields: [
      "目前可動用現金",
      "每月生活費",
      "每月固定支出",
      "安全現金水位目標",
      "股票 / 投資部位估值",
      "可接受最大創業測試預算",
      "可接受最大單項虧損",
      "是否有近期大額支出"
    ],
    need_mark_review: true,
    review_status: "pending",
    status: "waiting_mark_input",
    created_at: now,
    updated_at: now
  }
];

const startupAnalyses: StartupAnalysis[] = [
  {
    id: "startup-radar-template",
    opportunity_name: "創業機會雷達模板",
    market: "AI productivity / health SaaS",
    hypothesis: "Mark 的個人工作流可沉澱成可產品化的 AI operating system。",
    evidence: ["已有明確 command center 需求", "身境 App / SaaS 可成為第一個管理對象"],
    next_validation_step: "定義每週 opportunity scoring 欄位與資料來源。",
    score: 72,
    ...reviewDefaults,
    created_at: now,
    updated_at: now
  }
];

const knowledgeSop: KnowledgeSop[] = [
  {
    id: "safety-sop",
    title: "AI Center Safety SOP",
    domain: "safety",
    content:
      "AI 產生內容一律 need_mark_review = true。不得自動外發 LINE、IG，不得刪資料、下單、醫療診斷或承諾療效。",
    version: 1,
    ...reviewDefaults,
    created_at: now,
    updated_at: now
  },
  ...knowledgeSopSeedTemplates.map((template, index) => ({
    id: `knowledge-sop-seed-${index + 1}`,
    ...template,
    created_at: now,
    updated_at: now
  }))
];

const seedData = {
  users,
  projects: phase2Projects,
  ai_agents: phase2Agents,
  ai_inbox: aiInbox,
  task_dispatches: taskDispatches,
  daily_briefs: dailyBriefs,
  line_events: lineEvents,
  decision_reports: decisionReports,
  financial_profile: financialProfile,
  capital_allocations: capitalAllocations,
  startup_analyses: startupAnalyses,
  knowledge_sop: knowledgeSop
};

async function seed() {
  for (const [collectionName, docs] of Object.entries(seedData)) {
    for (const doc of docs) {
      await adminDb.collection(collectionName).doc(doc.id).set(doc, { merge: true });
      console.log(`Seeded ${collectionName}/${doc.id}`);
    }
  }
}

seed()
  .then(() => {
    console.log("Seed complete. No data was deleted.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
