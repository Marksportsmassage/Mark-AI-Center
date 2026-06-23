import type { Priority, TaskStage } from "@/types/firestore";

export interface MockRouteIntent {
  detected_intent: string;
  project_id: string;
  agent_ids: string[];
  confidence: number;
  needs_clarification: boolean;
  clarification_question?: string;
  summary: string;
  status: "new" | "waiting_clarification";
  should_create_task: boolean;
  task_type: string;
  stage: TaskStage;
  priority: Priority;
  codex_needed: boolean;
  summary_title?: string;
  next_actions?: string[];
  task_dispatch?: {
    title: string;
    task_type: string;
    background: string;
    instructions: string[];
    completion_standard: string;
    report_format: string;
    owner_type: "ai_agent";
    human_assistant_needed: boolean;
    ai_agent_needed: boolean;
    codex_needed: boolean;
  };
  business_decision?: {
    is_business_or_investment_decision: boolean;
    capital_required: string | null;
    expected_roi: string | null;
    payback_period: string | null;
    risk_level: "low" | "medium" | "high" | "unknown";
    cashflow_impact: string | null;
    stage: "idea" | "research" | "small_test" | "validation" | "scale" | "paused";
  };
  safety_forbidden_reasons?: string[];
}

const clarificationQuestion =
  "這件事比較接近哪一類：個人待辦、App 開發、學員課表、考試整理、投資分析、創業評估、品牌內容？";

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function isBusinessEvaluationQuestion(text: string) {
  return includesAny(text, [
    "評估",
    "成本",
    "資金",
    "可行",
    "損益",
    "回本",
    "毛利",
    "投入",
    "預算",
    "測試",
    "風險",
    "創業"
  ]);
}

const startupForbiddenReasons = ["不得自動進貨", "不得自動付款", "不得自動對外聯繫供應商", "不得承諾獲利"];

function apparelStartupRoute(base: Pick<MockRouteIntent, "needs_clarification" | "status" | "should_create_task" | "priority">): MockRouteIntent {
  return {
    ...base,
    detected_intent: "business_startup_analysis",
    project_id: "apparel_business",
    agent_ids: [
      "market_intelligence_ai",
      "business_model_ai",
      "cfo_ai",
      "risk_officer_ai",
      "supply_chain_ai",
      "growth_marketing_ai"
    ],
    confidence: 0.9,
    summary_title: "評估服飾選品創業初期測試資金",
    summary: "根據輸入整理，重點是評估服飾選品創業的初期測試資金、成本、風險與小額驗證方式。",
    next_actions: [
      "估算初期測試資金範圍",
      "拆解成本項目：進貨、拍攝、上架、廣告、包材、退換貨",
      "評估最小可行測試方式",
      "建立風險與停損條件"
    ],
    task_type: "startup_capital_analysis",
    stage: "research",
    codex_needed: false,
    priority: "high",
    task_dispatch: {
      title: "評估服飾選品創業初期測試資金",
      task_type: "startup_capital_analysis",
      background: "Mark 想評估服飾選品創業，重點是初期測試資金、成本結構、庫存風險與小額驗證。",
      instructions: [
        "估算服飾選品初期測試資金範圍",
        "拆解進貨、拍攝、上架、廣告、包材與退換貨成本",
        "評估小額測試方案，避免一開始大量壓庫存",
        "提出停損條件與是否值得進入下一階段"
      ],
      completion_standard: "產出一份可供 Mark 審核的服飾選品小額測試資金與風險評估。",
      report_format: "用表格列出成本、預算範圍、風險、測試方式、是否建議執行。",
      owner_type: "ai_agent",
      human_assistant_needed: false,
      ai_agent_needed: true,
      codex_needed: false
    },
    business_decision: {
      is_business_or_investment_decision: true,
      capital_required: null,
      expected_roi: null,
      payback_period: null,
      risk_level: "medium",
      cashflow_impact: "需要評估是否動用創業測試預算，不可影響安全現金水位。",
      stage: "research"
    },
    safety_forbidden_reasons: startupForbiddenReasons
  };
}

export function mockRouteIntent(input: string): MockRouteIntent {
  const text = input.toLowerCase();
  const base = {
    needs_clarification: false,
    status: "new" as const,
    should_create_task: true,
    priority: "medium" as const
  };

  if (includesAny(text, ["codex", "開發", "app", "功能"])) {
    return {
      ...base,
      detected_intent: "app_development",
      project_id: "body_state_app",
      agent_ids: ["product_ai", "project_manager_ai"],
      confidence: 0.86,
      summary: "App / Codex / 功能開發相關輸入，需要整理成產品或開發任務。",
      task_type: "app_development",
      stage: "idea",
      codex_needed: true
    };
  }

  if (includesAny(text, ["資金複利", "資金配置"]) || (includesAny(text, ["資金"]) && includesAny(text, ["股票", "創業", "配置"]))) {
    return {
      ...base,
      detected_intent: "capital_allocation_decision",
      project_id: "capital_compounding",
      agent_ids: ["cfo_ai", "capital_allocation_ai", "investment_ai", "risk_officer_ai"],
      confidence: 0.88,
      summary: "資金複利 / 資金配置相關輸入，需要比較股票、創業測試與現金水位風險。",
      task_type: "capital_allocation",
      stage: "research",
      codex_needed: false,
      priority: "high"
    };
  }

  if (includesAny(text, ["股票", "大盤", "投資"])) {
    return {
      ...base,
      detected_intent: "investment_research",
      project_id: "market_daily",
      agent_ids: ["investment_ai", "capital_allocation_ai", "risk_officer_ai"],
      confidence: 0.84,
      summary: "投資或市場分析相關輸入，只建立研究任務，不下單、不保證獲利。",
      task_type: "investment",
      stage: "research",
      codex_needed: false
    };
  }

  if (
    includesAny(text, ["服飾", "選品", "測試資金", "初期資金", "初期投入", "批發", "進貨", "庫存", "毛利", "回本"]) &&
    isBusinessEvaluationQuestion(text)
  ) {
    return apparelStartupRoute(base);
  }

  if (includesAny(text, ["一番賞", "公仔"]) && isBusinessEvaluationQuestion(text)) {
    return {
      ...base,
      detected_intent: "ichiban_kuji_startup",
      project_id: "ichiban_kuji_business",
      agent_ids: ["market_intelligence_ai", "business_model_ai", "risk_officer_ai", "cfo_ai", "operations_sop_ai"],
      confidence: 0.88,
      summary: "一番賞 / 公仔抽賞創業評估輸入，需要市場、商模、風險與財務研究。",
      task_type: "startup",
      stage: "research",
      codex_needed: false,
      priority: "high"
    };
  }

  if (includesAny(text, ["飲料店"]) && isBusinessEvaluationQuestion(text)) {
    return {
      ...base,
      detected_intent: "beverage_startup",
      project_id: "beverage_business",
      agent_ids: ["market_intelligence_ai", "business_model_ai", "risk_officer_ai", "cfo_ai", "operations_sop_ai", "growth_marketing_ai"],
      confidence: 0.88,
      summary: "飲料店創業評估輸入，需要商圈、商模、風險、SOP 與財務研究。",
      task_type: "startup",
      stage: "research",
      codex_needed: false,
      priority: "high"
    };
  }

  if (includesAny(text, ["考試", "課程", "總整理"])) {
    return {
      ...base,
      detected_intent: "exam_review",
      project_id: "final_exam_review",
      agent_ids: ["content_ai", "knowledge_ai"],
      confidence: 0.82,
      summary: "考試或課程總整理相關輸入，需要整理重點與輸出素材。",
      task_type: "study",
      stage: "research",
      codex_needed: false
    };
  }

  if (includesAny(text, ["學員", "課表", "客戶"])) {
    return {
      ...base,
      detected_intent: "student_schedule",
      project_id: "student_schedule",
      agent_ids: ["client_manager_ai", "secretary_ai"],
      confidence: 0.82,
      summary: "學員、課表或客戶管理相關輸入，需要整理追蹤與回訪任務。",
      task_type: "client_schedule",
      stage: "research",
      codex_needed: false
    };
  }

  return {
    detected_intent: "needs_clarification",
    project_id: "core_operations",
    agent_ids: ["chief_ai", "project_manager_ai"],
    confidence: 0.35,
    needs_clarification: true,
    clarification_question: clarificationQuestion,
    summary: "分類信心不足，等待 Mark 補充類別。",
    status: "waiting_clarification",
    should_create_task: false,
    task_type: "clarification",
    stage: "research",
    priority: "medium",
    codex_needed: false
  };
}
