import type { ExpenseSignal } from "@/types/firestore";
import { matchExamReviewTopics, type ExamReviewTopic } from "@/lib/examSummary";

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
  completed: string[];
  review_items: string[];
  ask_examples: string[];
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
  content_summary?: {
    title: string;
    description: string;
    recommended_start: string;
    ready: string[];
    needs_review: string[];
    topics: ExamReviewTopic[];
  };
  review_dashboard?: AssistantReviewDashboard;
}

export interface AssistantReviewDashboard {
  completed: Array<{ title: string; detail: string; href: string }>;
  needsMarkReview: Array<{ title: string; detail: string; href: string; risk: AssistantRisk }>;
  suggestedQuestions: string[];
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
    why: "外科、ROM 題庫、MMT、TENS、肌肉電刺激、脊椎牽引、震波都已整理；HIFEM 缺檔，掃描頁需確認。",
    impact_if_ignored: "考前會變成臨時翻 PDF，題庫、圖片總整理與簡報式複習無法快速使用。",
    next_action: "先看 /exam-review 的圖片式與簡報式總整理，再展開題庫。",
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
    completed: ["Finance baseline active", "CFO Brief draft", "Line Pay / 一番賞警訊已列入追蹤"],
    review_items: ["核對 940 差額", "確認自動分期卡每月最低壓力", "補學貸開始還款時間"],
    ask_examples: ["我現在可以花錢嗎？", "今天財務最危險的是什麼？", "這筆支出值得嗎？"],
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
    completed: ["核心 / 題材分類已建立", "15 筆 investment_decisions 保持 waiting_review", "average_down_allowed=false"],
    review_items: ["補目標價", "補停損點", "補加碼與減碼條件"],
    ask_examples: ["股票可以加碼嗎？", "NVDA 要怎麼 review？", "哪些股票缺停損？"],
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
    completed: ["Client Ops 入口可用", "可建立 session note draft", "醫療診斷安全限制已啟用"],
    review_items: ["補客戶目標", "補訓練日期", "補禁忌或注意事項"],
    ask_examples: ["我要整理客戶課表", "幫我建立下次課表草稿", "這個客戶注意事項怎麼整理？"],
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
    pending: "HIFEM 缺檔；ROM 講義與操作治療四肢掃描需人工確認",
    missing: ["HIFEM 講義", "ROM 講義 OCR", "操作治療四肢 OCR"],
    recent: "外科、ROM 題庫、MMT、TENS、肌肉電刺激、脊椎牽引、震波、操作治療跑台題已整理。",
    next_action: "先看 /exam-review 圖片式總整理，再進各科題庫。",
    completed: ["外科題庫與答案", "ROM / MMT 題庫與跑台索引", "物理因子 TENS / 肌肉電刺激 / 牽引 / 震波", "操作治療跑台題"],
    review_items: ["補 HIFEM", "確認 ROM 掃描頁", "確認操作治療四肢掃描細節"],
    ask_examples: ["我要準備期末考", "TENS 怎麼讀？", "ROM / MMT 今天先背什麼？"],
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
    completed: ["Decision Lab 可用", "Recovery Plans 可用", "警訊支出可轉成事業測試 review"],
    review_items: ["若要做事業測試，補預算上限", "補成本表", "補停損線"],
    ask_examples: ["這筆支出是娛樂還是事業測試？", "我要規劃一個小測試", "怎麼補回 11840？"],
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
    completed: ["Assistant 首頁", "Assistant Universe", "Exam Review Center", "App Hosting 單次部署"],
    review_items: ["查 Billing service breakdown", "下次開發批次規劃", "確認哪些頁面 Mark 看不懂"],
    ask_examples: ["App 下一步做什麼？", "助理系統還缺什麼？", "今天開發要先收斂哪裡？"],
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
    completed: ["Safety Center", "Cloud cost guard", "LINE / functions / external action 禁止規則"],
    review_items: ["確認雲端成本 breakdown", "確認是否需要 LINE reply 批准", "確認是否要開付費 OCR"],
    ask_examples: ["現在系統安全嗎？", "哪些外部動作被禁止？", "雲端成本要怎麼控？"],
    nodes: [
      { label: "safety-center", href: "/safety-center", status: "active" },
      { label: "system-status", href: "/system-status", status: "ready" },
      { label: "audit-logs", href: "/audit-logs", status: "reviewable" }
    ]
  }
];

export function buildAssistantReviewDashboard(): AssistantReviewDashboard {
  const examTopics = matchExamReviewTopics("期末考");
  return {
    completed: [
      { title: "助理首頁", detail: "可直接輸入問題，回答會附下一步與入口。", href: "/assistant" },
      { title: "助理宇宙圖", detail: "七個助理分支可點擊，顯示狀態、風險與節點。", href: "/assistant-universe" },
      { title: "期末考整理中心", detail: `已整理 ${examTopics.length} 個科目群，包含題庫、圖片與簡報式總整理。`, href: "/exam-review" },
      { title: "財務警訊追蹤", detail: "Finance baseline active，expense signal 維持 watch。", href: "/today" }
    ],
    needsMarkReview: [
      { title: "期末考掃描頁", detail: "ROM 講義、操作治療四肢掃描內容需人工確認。", href: "/exam-review", risk: "watch" },
      { title: "HIFEM 缺檔", detail: "物理因子尚缺高強度聚焦磁場治療講義。", href: "/exam-review/physical-modality", risk: "watch" },
      { title: "支出警訊", detail: "Line Pay / 一番賞支出 11,840 與 940 差額仍需確認。", href: "/finance-decisions", risk: "warning" },
      { title: "投資條件", detail: "投資決策仍 waiting_review，需補目標價、停損與加碼條件。", href: "/investment-decisions", risk: "watch" }
    ],
    suggestedQuestions: [
      "我今天先做什麼？",
      "我要準備期末考",
      "TENS 怎麼讀？",
      "ROM / MMT 今天先背什麼？",
      "我現在可以花錢嗎？",
      "股票可以加碼嗎？",
      "助理系統還缺什麼？"
    ]
  };
}

export function assistantBranchCompletion(branch: AssistantBranch) {
  const done = branch.completed.length;
  const review = branch.review_items.length;
  const total = Math.max(done + review, 1);
  return Math.round((done / total) * 100);
}

export function inferAssistantMode(question: string) {
  if (/考|期末|ROM|MMT|講義|題庫|讀書|國考|TENS|震波|牽引|肌肉電刺激|操作治療|外科/.test(question)) return "exam";
  if (/助理系統|宇宙圖|看不懂|完成|進度|缺什麼|需要確認/.test(question)) return "assistant_system";
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
    const topics = matchExamReviewTopics(question);
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: "可以直接跳出期末考總整理；只使用已提供 PDF 裡可抽取或可明確索引的內容。",
        priority: "先看已完成的題庫與講義重點，再處理標成待確認的掃描檔。",
        risk: "掃描無文字或缺檔的地方不會補不存在的答案；會標示 Mark 需要確認。",
        next_step: "從下方內容總整理卡片選科目，先讀題庫、圖片總整理與簡報式總整理。",
        draft_available: "可建立學習整理草稿，但不自動產生假題。",
        links: [{ label: "Exam Review", href: "/exam-review" }, { label: "Content Studio", href: "/content-studio" }]
      },
      content_summary: {
        title: topics.length === 1 ? `${topics[0].subject} 內容總整理` : "期末考內容總整理",
        description: "以下是系統目前已製作完成與需要 Mark 確認的內容。",
        recommended_start: topics.length === 1 ? `先看 ${topics[0].subject} 的圖片式總整理，再讀題庫或講義重點。` : "先從圖片式總整理掃過四科，再讀 ROM / MMT 與物理因子的考前 30 分鐘整理。",
        ready: topics.flatMap((topic) => topic.whatIsReady.map((item) => `${topic.subject}: ${item}`)).slice(0, 10),
        needs_review: topics.flatMap((topic) => topic.needsMarkReview.map((item) => `${topic.subject}: ${item}`)).slice(0, 10),
        topics
      },
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_fabricated_questions"]
    };
  }
  if (mode === "assistant_system") {
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: "助理系統已從後台清單往每日操作介面收斂；現在重點是讓 Mark 看懂、能問、能點、能看到待確認。",
        priority: "先驗收 /assistant、/assistant-universe、/today、/exam-review 四個入口。",
        risk: "如果沒有持續把完成品與待確認項目做成卡片，系統會退回後台列表，Mark 會不知道每天要先看哪裡。",
        next_step: "看下方系統完成與待確認卡片；先點需要 Mark 確認的項目。",
        draft_available: "可建立產品任務草稿，但不自動 deploy、不自動開外部流程。",
        links: [{ label: "Assistant", href: "/assistant" }, { label: "Universe", href: "/assistant-universe" }, { label: "Today", href: "/today" }]
      },
      review_dashboard: buildAssistantReviewDashboard(),
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_external_automation"]
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
