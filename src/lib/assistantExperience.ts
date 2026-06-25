import type { ExpenseSignal } from "@/types/firestore";

export type AssistantRisk = "normal" | "watch" | "warning" | "critical";

export interface AssistantSuggestion {
  id: string;
  title: string;
  risk: AssistantRisk;
  why: string;
  impact_if_ignored: string;
  next_action: string;
  href: string;
  draft_label?: string;
}

export interface AssistantBranch {
  id: string;
  title: string;
  short_title: string;
  href: string;
  purpose: string;
  status: string;
  risk: AssistantRisk;
  pending: string;
  missing: string[];
  recent: string;
  next_action: string;
  nodes: Array<{ label: string; href: string; status: string }>;
}

export interface AssistantAnswer {
  mode: "structured_rule_based";
  sections: {
    current_judgment: string;
    priority: string;
    risk: string;
    next_step: string;
    draft_available: string;
    links: Array<{ label: string; href: string }>;
  };
  safety_flags: string[];
}

export const assistantSuggestions: AssistantSuggestion[] = [
  {
    id: "warning-spending",
    title: "先看 Line Pay / 一番賞警訊",
    risk: "warning",
    why: "本月已記錄 11,840 的非必要娛樂 / 抽賞支出，且 940 差額待核對。",
    impact_if_ignored: "同類支出如果繼續累積，會吃掉生活現金流，還可能被誤當成資產。",
    next_action: "確認純娛樂或事業測試，若是娛樂，本月同類暫停。",
    href: "/finance-decisions",
    draft_label: "建立支出 review draft"
  },
  {
    id: "credit-installment",
    title: "控管信用卡與自動 12 期分期卡",
    risk: "watch",
    why: "信用卡與分期已確認沒有重複，但一萬元以上自動分 12 期會拉長現金流壓力。",
    impact_if_ignored: "帳面上看似可刷，實際上會把未來 12 個月卡住。",
    next_action: "先補每張卡的最低現金流壓力，暫停高額分期。",
    href: "/expense-signals"
  },
  {
    id: "investment-review",
    title: "投資只做條件式 review",
    risk: "watch",
    why: "15 筆 investment_decisions 仍 waiting_review，且缺目標價、停損點。",
    impact_if_ignored: "容易在現金流弱的時候做無條件加碼或攤平。",
    next_action: "先補核心 / 短線標的停損與目標價。",
    href: "/investment-decisions"
  },
  {
    id: "exam-review",
    title: "整理期末考資料",
    risk: "normal",
    why: "已找到 MMT、震波、操作治療部分素材；ROM、外科、HIFEM 仍待補。",
    impact_if_ignored: "考前會變成臨時翻 PDF，題庫和必背表格無法快速複習。",
    next_action: "先讀 /exam-review 的 MMT 與震波整理，再補缺的 PDF。",
    href: "/exam-review"
  },
  {
    id: "today-plan",
    title: "今天只收斂 3 件事",
    risk: "normal",
    why: "系統頁面很多，先從助理首頁收斂，不再到處跳。",
    impact_if_ignored: "容易回到後台清單模式，看很多但沒做下一步。",
    next_action: "看 Today、Review Queue、Exam Review 三個入口。",
    href: "/today"
  }
];

export const assistantBranches: AssistantBranch[] = [
  {
    id: "cfo",
    title: "CFO 財務助理",
    short_title: "CFO",
    href: "/today",
    purpose: "整理現金流、信用卡、分期、支出警訊與 CFO Brief。",
    status: "baseline active; expense signal watch",
    risk: "watch",
    pending: "信用卡 / 分期 / 警訊支出仍需 review",
    missing: ["生活費需用實際支出校正", "學貸開始還款時間", "保險獨立時程"],
    recent: "Line Pay / 一番賞支出已列入 warning spending。",
    next_action: "先看 Today，再到 Review Queue 審核。",
    nodes: [
      { label: "finance-baseline", href: "/finance-baseline", status: "active" },
      { label: "expense-signals", href: "/expense-signals", status: "watch" },
      { label: "credit card / installment", href: "/review-queue", status: "review" },
      { label: "CFO brief", href: "/today", status: "draft" }
    ]
  },
  {
    id: "investment",
    title: "投資決策助理",
    short_title: "投資",
    href: "/investment-decisions",
    purpose: "把股票從衝動判斷改成條件式 review。",
    status: "15 筆 waiting_review",
    risk: "watch",
    pending: "核心 / 題材分類已補，目標價與停損仍缺",
    missing: ["目標價", "停損點", "加碼條件", "減碼條件"],
    recent: "ETF、台積電、鴻海、美股為長期核心；其他多為短期 / 題材。",
    next_action: "補 2201、2317、4749、MU、NVDA 條件。",
    nodes: [
      { label: "investment-decisions", href: "/investment-decisions", status: "waiting_review" },
      { label: "core assets", href: "/investment-decisions", status: "needs conditions" },
      { label: "review needed", href: "/review-queue", status: "open" },
      { label: "no average down warning", href: "/safety-center", status: "active" }
    ]
  },
  {
    id: "client",
    title: "客戶與課表助理",
    short_title: "客戶",
    href: "/client-ops",
    purpose: "整理客戶紀錄、課表、下次訓練計畫與注意事項，不做醫療診斷。",
    status: "ready",
    risk: "normal",
    pending: "待 Mark 貼客戶或課表資料",
    missing: ["客戶目標", "訓練日期", "禁忌或注意事項"],
    recent: "可建立 session note / next training plan draft。",
    next_action: "貼客戶課表到 Intake 或 Client Ops。",
    nodes: [
      { label: "client-ops", href: "/client-ops", status: "ready" },
      { label: "session notes", href: "/client-ops", status: "draft only" },
      { label: "next plan", href: "/client-ops", status: "review" }
    ]
  },
  {
    id: "content",
    title: "內容與國考助理",
    short_title: "內容 / 考試",
    href: "/exam-review",
    purpose: "整理期末考、國考、內容素材與草稿，不編造題目、不自動發布。",
    status: "exam workspace partial",
    risk: "normal",
    pending: "ROM、外科、HIFEM PDF 待補",
    missing: ["ROM 題庫", "外科題目", "HIFEM 講義"],
    recent: "MMT、震波、操作治療部分教材已找到並整理。",
    next_action: "先讀 MMT / 震波，再補缺檔。",
    nodes: [
      { label: "content-studio", href: "/content-studio", status: "ready" },
      { label: "study notes", href: "/content-studio", status: "draft" },
      { label: "final exam review", href: "/exam-review", status: "partial" }
    ]
  },
  {
    id: "business",
    title: "商業模式助理",
    short_title: "商業",
    href: "/business-lab",
    purpose: "把想法轉成小額測試、回收計畫與停損線。",
    status: "ready",
    risk: "normal",
    pending: "待 Mark 選下一個測試",
    missing: ["預算上限", "回收期限", "停損條件"],
    recent: "一番賞若要繼續，只能改成事業測試並補成本表。",
    next_action: "建立 business experiment draft。",
    nodes: [
      { label: "business-lab", href: "/business-lab", status: "ready" },
      { label: "decision-lab", href: "/decision-lab", status: "ready" },
      { label: "recovery-plans", href: "/recovery-plans", status: "ready" }
    ]
  },
  {
    id: "product",
    title: "App / Codex 產品助理",
    short_title: "產品",
    href: "/product-roadmap",
    purpose: "整理產品功能、Codex 工作與 roadmap，不自動 deploy。",
    status: "ready",
    risk: "watch",
    pending: "雲端成本已達 USD 25 budget watch",
    missing: ["成本 breakdown", "下次 deploy 批次"],
    recent: "今天前端完成後只部署 App Hosting 一次。",
    next_action: "看 Product Roadmap 或 Command Brain。",
    nodes: [
      { label: "product-roadmap", href: "/product-roadmap", status: "ready" },
      { label: "codex-jobs", href: "/codex-jobs", status: "review" },
      { label: "command-brain", href: "/command-brain", status: "active" }
    ]
  },
  {
    id: "safety",
    title: "安全與系統助理",
    short_title: "安全",
    href: "/safety-center",
    purpose: "確認禁止事項、audit logs、系統狀態與成本守門。",
    status: "active",
    risk: "watch",
    pending: "Cloud cost guard watch",
    missing: ["Billing Console service breakdown"],
    recent: "不啟用 functions / LINE reply / paid OCR / market data。",
    next_action: "查看 Safety Center 和 System Status。",
    nodes: [
      { label: "safety-center", href: "/safety-center", status: "active" },
      { label: "system-status", href: "/system-status", status: "ready" },
      { label: "audit-logs", href: "/audit-logs", status: "reviewable" }
    ]
  }
];

export function inferAssistantMode(question: string) {
  if (/考|期末|ROM|MMT|講義|題庫|讀書|國考/.test(question)) return "exam";
  if (/股票|投資|加碼|攤平|買|賣|NVDA|MU|台積電|鴻海/.test(question)) return "investment";
  if (/花錢|支出|信用卡|分期|現金|財務|風險|可以花/.test(question)) return "finance";
  if (/客戶|課表|訓練|按摩|疼|痛/.test(question)) return "client";
  if (/App|產品|Codex|功能|deploy|開發/.test(question)) return "product";
  return "general";
}

export function buildAssistantAnswer(question: string): AssistantAnswer {
  const mode = inferAssistantMode(question);
  const baseLinks = [{ label: "Review Queue", href: "/review-queue" }];
  if (mode === "investment") {
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: "不能給單一買賣指令或加碼指令。現在只能做條件式投資 review。",
        priority: "先補目標價、停損點、加碼條件與減碼條件。",
        risk: "目前現金流偏緊，投資決策仍 waiting_review，average_down_allowed=false。",
        next_step: "到 investment-decisions 檢查標的，先處理虧損或題材股。",
        draft_available: "可建立投資 review draft，但不會下單。",
        links: [{ label: "Investment Decisions", href: "/investment-decisions" }, ...baseLinks]
      },
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_unconditional_buy_sell"]
    };
  }
  if (mode === "exam") {
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: "可以先讀已整理的 MMT、震波與操作治療索引；ROM、外科、HIFEM 仍缺來源 PDF。",
        priority: "先從 /exam-review 看完成度，再補缺的題庫或講義。",
        risk: "缺教材時我不會編題目或答案；所有待補會清楚標記。",
        next_step: "今天先讀 MMT 表格與震波講義重點，再補 ROM / 外科 PDF。",
        draft_available: "可建立學習整理草稿，但不自動產生假題。",
        links: [{ label: "Exam Review", href: "/exam-review" }, { label: "Content Studio", href: "/content-studio" }]
      },
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_fabricated_questions"]
    };
  }
  if (mode === "client") {
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: "可以整理客戶課表、session note、下次訓練草稿，但不做醫療診斷。",
        priority: "補客戶目標、日期、訓練內容與注意事項。",
        risk: "疼痛或受傷描述只能列 caution notes，不能診斷。",
        next_step: "到 Client Ops 或 Intake 建立 review-gated draft。",
        draft_available: "可建立 client session draft。",
        links: [{ label: "Client Ops", href: "/client-ops" }, { label: "Intake", href: "/intake" }]
      },
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_medical_diagnosis"]
    };
  }
  if (mode === "product") {
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: "App 下一步應該批次收斂，不要每個小修改都 deploy。",
        priority: "先修手機入口、助理首頁、宇宙圖與 exam review。",
        risk: "Google Cloud 已到 USD 25 budget watch，不啟用 functions 或付費 API。",
        next_step: "到 Command Brain / Product Roadmap 看產品任務。",
        draft_available: "可建立 product task draft，不自動 PR/deploy。",
        links: [{ label: "Command Brain", href: "/command-brain" }, { label: "Product Roadmap", href: "/product-roadmap" }]
      },
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_functions_deploy"]
    };
  }
  return {
    mode: "structured_rule_based",
    sections: {
      current_judgment: "今天先收斂，不再從一堆後台頁面找方向。",
      priority: "先處理警訊支出、Review Queue、期末考資料三件事。",
      risk: "財務狀態仍 watch，信用卡 / 分期與投資都不能跳過 review。",
      next_step: "看建議卡，選一張進入；有新資料就貼 Intake。",
      draft_available: "可建立財務、學習、客戶或產品 draft，全部需要 Mark review。",
      links: [{ label: "Today", href: "/today" }, { label: "Intake", href: "/intake" }, ...baseLinks]
    },
    safety_flags: ["external_action_allowed=false", "need_mark_review=true", "structured_assistant_mode"]
  };
}

export function latestFinanceStatus(signals: ExpenseSignal[]) {
  return signals[0]?.threshold_status ?? "watch";
}

