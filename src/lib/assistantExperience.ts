import type { ExpenseSignal } from "@/types/firestore";
import { matchExamReviewTopics, type ExamReviewTopic } from "@/lib/examSummary";
import { buildAssistantOpsDashboard } from "@/lib/assistantOps";
import { sevenDaySprint, todayIncomeTasks } from "@/lib/incomeStrategy";
import { getTimeContext } from "@/lib/timeContext";

export type AssistantRisk = "normal" | "watch" | "warning" | "critical";

export const assistantRiskLabels: Record<AssistantRisk, string> = {
  normal: "正常",
  watch: "觀察",
  warning: "警訊",
  critical: "緊急"
};

export function assistantRiskLabel(risk: AssistantRisk) {
  return assistantRiskLabels[risk] ?? risk;
}

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
  memory_items: string[];
  reminder_rules: string[];
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
  ops_dashboard?: ReturnType<typeof buildAssistantOpsDashboard>;
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
    id: "income-growth",
    title: "今天先做收入成長任務",
    risk: "normal",
    why: "Mark 目前現金流壓力大，最有用的是把舊客回流、高單價服務與內容產品化變成今天可做的行動。",
    impact_if_ignored: "只控支出但沒有提高收入，信用卡、分期與雲端成本壓力仍會累積。",
    next_action: "先看 /income-lab 的 7-day sprint，今天做 3 個不花錢收入任務。",
    href: "/income-lab",
    draft_label: "建立收入行動草稿"
  },
  {
    id: "today-plan",
    title: "今天只收斂 3 件事",
    risk: "normal",
    why: "系統頁面很多，先從助理首頁收斂，不再到處跳。",
    impact_if_ignored: "容易回到後台清單模式，看很多但沒做下一步。",
    next_action: "看 Today、Review Queue、Exam Review 三個入口。",
    href: "/today"
  },
  {
    id: "data-status",
    title: "先看資料狀態，避免重複補資料",
    risk: "normal",
    why: "Mark 已經提供很多資料；系統需要知道哪些不要再問、哪些才真的阻擋決策。",
    impact_if_ignored: "助理會一直繞在缺資料問題上，浪費 Mark 的注意力。",
    next_action: "到 /data-status 看 provided / missing / do-not-ask-again。",
    href: "/data-status",
    draft_label: "建立資料補齊草稿"
  }
];

export const assistantBranches: AssistantBranch[] = [
  {
    id: "cfo",
    title: "財務長助理",
    short_title: "CFO",
    href: "/today",
    purpose: "公司裡負責現金流、信用卡、分期、支出警訊與 CFO Brief 的財務長助理。",
    status: "財務基準已啟用；支出警訊觀察中",
    risk: "watch",
    pending: "信用卡 / 分期 / 警訊支出仍需 review",
    missing: ["生活費需用實際支出校正", "學貸開始還款時間", "保險獨立時程"],
    recent: "Line Pay / 一番賞支出已列入 warning spending。",
    next_action: "先看 Today，再到 Review Queue 審核。",
    completed: ["財務基準已確認啟用", "CFO Brief 草稿已建立", "Line Pay / 一番賞警訊已列入追蹤"],
    review_items: ["核對 940 差額", "確認自動分期卡每月最低壓力", "補學貸開始還款時間"],
    ask_examples: ["我現在可以花錢嗎？", "今天財務最危險的是什麼？", "這筆支出值得嗎？"],
    memory_items: ["基本月現金需求約 51,319–56,319", "目前收入偏弱", "信用卡與分期維持觀察", "一番賞 / 玩具支出是本月警訊"],
    reminder_rules: ["新增高額分期前提醒", "非必要大額消費前提醒", "投資加碼前提醒現金流壓力"],
    nodes: [
      { label: "財務基準", href: "/finance-baseline", status: "已啟用" },
      { label: "支出警訊", href: "/expense-signals", status: "觀察中" },
      { label: "信用卡 / 分期審核", href: "/review-queue", status: "待審核" },
      { label: "CFO 今日簡報", href: "/today", status: "草稿" }
    ]
  },
  {
    id: "investment",
    title: "投資風控助理",
    short_title: "投資",
    href: "/investment-decisions",
    purpose: "公司裡負責把股票判斷改成條件式審核、不讓 Mark 衝動加碼的投資風控助理。",
    status: "15 筆投資決策待審核",
    risk: "watch",
    pending: "核心 / 題材分類已補，目標價與停損仍缺",
    missing: ["目標價", "停損點", "加碼條件", "減碼條件"],
    recent: "ETF、台積電、鴻海、美股為長期核心；其他多為短期 / 題材。",
    next_action: "補 2201、2317、4749、MU、NVDA 條件。",
    completed: ["核心 / 題材分類已建立", "15 筆投資決策保持待審核", "攤平預設禁止"],
    review_items: ["補目標價", "補停損點", "補加碼與減碼條件"],
    ask_examples: ["股票可以加碼嗎？", "NVDA 要怎麼 review？", "哪些股票缺停損？"],
    memory_items: ["ETF、台積電、鴻海、美股屬長期核心", "2201、2303、2409、4749、TSLA 屬短期 / 題材", "所有投資都不可自動下單"],
    reminder_rules: ["問加碼時先提醒缺目標價與停損", "問買賣時只給條件式判斷", "現金流弱時提醒暫停大額加碼"],
    nodes: [
      { label: "投資決策", href: "/investment-decisions", status: "待審核" },
      { label: "核心資產", href: "/investment-decisions", status: "需補條件" },
      { label: "審核佇列", href: "/review-queue", status: "開放" },
      { label: "禁止無條件攤平", href: "/safety-center", status: "已啟用" }
    ]
  },
  {
    id: "client",
    title: "客戶課表助理",
    short_title: "客戶",
    href: "/client-ops",
    purpose: "公司裡負責整理客戶紀錄、課表、下次訓練計畫與注意事項的客戶助理；不做醫療診斷。",
    status: "可接收客戶資料",
    risk: "normal",
    pending: "待 Mark 貼客戶或課表資料",
    missing: ["客戶目標", "訓練日期", "禁忌或注意事項"],
    recent: "可建立 session note / next training plan draft。",
    next_action: "貼客戶課表到 Intake 或 Client Ops。",
    completed: ["客戶營運入口可用", "可建立課程紀錄草稿", "醫療診斷安全限制已啟用"],
    review_items: ["補客戶目標", "補訓練日期", "補禁忌或注意事項"],
    ask_examples: ["我要整理客戶課表", "幫我建立下次課表草稿", "這個客戶注意事項怎麼整理？"],
    memory_items: ["客戶資料只能建立草稿", "疼痛描述只能列注意事項", "不自動傳訊息給客戶"],
    reminder_rules: ["缺日期時提醒補課程時間", "出現疼痛字眼時提醒不可診斷", "課表輸出前提醒 Mark 審核"],
    nodes: [
      { label: "客戶營運", href: "/client-ops", status: "可用" },
      { label: "課程紀錄", href: "/client-ops", status: "只建草稿" },
      { label: "下次課表", href: "/client-ops", status: "需審核" }
    ]
  },
  {
    id: "content",
    title: "學習內容助理",
    short_title: "內容 / 考試",
    href: "/exam-review",
    purpose: "公司裡負責期末考、國考、內容素材與草稿的學習內容助理；不編造題目、不自動發布。",
    status: "期末考工作區部分完成",
    risk: "normal",
    pending: "HIFEM 缺檔；ROM 講義與操作治療四肢掃描需人工確認",
    missing: ["HIFEM 講義", "ROM 講義 OCR", "操作治療四肢 OCR"],
    recent: "外科、ROM 題庫、MMT、TENS、肌肉電刺激、脊椎牽引、震波、操作治療跑台題已整理。",
    next_action: "先看 /exam-review 圖片式總整理，再進各科題庫。",
    completed: ["外科題庫與答案", "ROM / MMT 題庫與跑台索引", "物理因子 TENS / 肌肉電刺激 / 牽引 / 震波", "操作治療跑台題"],
    review_items: ["補 HIFEM", "確認 ROM 掃描頁", "確認操作治療四肢掃描細節"],
    ask_examples: ["我要準備期末考", "TENS 怎麼讀？", "ROM / MMT 今天先背什麼？"],
    memory_items: ["外科、ROM/MMT、物理因子、操作治療已有整理", "HIFEM 缺檔", "掃描頁需要人工確認"],
    reminder_rules: ["問考試時先跳已整理內容", "缺教材時提醒待補，不編造", "考前優先顯示 30 分鐘複習"],
    nodes: [
      { label: "內容工作室", href: "/content-studio", status: "可用" },
      { label: "學習筆記", href: "/content-studio", status: "草稿" },
      { label: "期末考整理", href: "/exam-review", status: "部分完成" }
    ]
  },
  {
    id: "business",
    title: "商業實驗助理",
    short_title: "商業",
    href: "/business-lab",
    purpose: "公司裡負責把想法轉成小額測試、回收計畫與停損線的商業實驗助理。",
    status: "可建立商業測試草稿",
    risk: "normal",
    pending: "待 Mark 選下一個測試",
    missing: ["預算上限", "回收期限", "停損條件"],
    recent: "一番賞若要繼續，只能改成事業測試並補成本表。",
    next_action: "建立 business experiment draft。",
    completed: ["決策實驗室可用", "回收計畫可用", "警訊支出可轉成事業測試審核"],
    review_items: ["若要做事業測試，補預算上限", "補成本表", "補停損線"],
    ask_examples: ["這筆支出是娛樂還是事業測試？", "我要規劃一個小測試", "怎麼補回 11840？"],
    memory_items: ["一番賞若要繼續必須是事業測試", "事業測試需要預算上限、成本表、回收價、停損線"],
    reminder_rules: ["沒有回收計畫時提醒列為娛樂支出", "測試超過預算時提醒停止", "不能聯絡供應商或自動下單"],
    nodes: [
      { label: "商業實驗室", href: "/business-lab", status: "可用" },
      { label: "決策實驗室", href: "/decision-lab", status: "可用" },
      { label: "回收計畫", href: "/recovery-plans", status: "可用" }
    ]
  },
  {
    id: "product",
    title: "產品開發助理",
    short_title: "產品",
    href: "/product-roadmap",
    purpose: "公司裡負責產品功能、Codex 任務與 roadmap 的產品開發助理；不自動部署。",
    status: "產品任務可整理",
    risk: "watch",
    pending: "雲端成本已達 USD 25 budget watch",
    missing: ["成本 breakdown", "下次 deploy 批次"],
    recent: "今天前端完成後只部署 App Hosting 一次。",
    next_action: "看 Product Roadmap 或 Command Brain。",
    completed: ["助理首頁", "3D 助理宇宙", "期末考整理中心", "App Hosting 單次部署"],
    review_items: ["查 Billing service breakdown", "下次開發批次規劃", "確認哪些頁面 Mark 看不懂"],
    ask_examples: ["App 下一步做什麼？", "助理系統還缺什麼？", "今天開發要先收斂哪裡？"],
    memory_items: ["Google Cloud 成本已到 USD 25 watch line", "不要頻繁部署", "不部署 functions 除非 Mark 批准"],
    reminder_rules: ["每次 deploy 前提醒成本", "新增付費 API 前提醒審核", "功能太分散時提醒回到助理首頁"],
    nodes: [
      { label: "產品路線圖", href: "/product-roadmap", status: "可用" },
      { label: "Codex 任務", href: "/codex-jobs", status: "待審核" },
      { label: "指揮腦", href: "/command-brain", status: "已啟用" },
      { label: "Master Index", href: "/master-index", status: "可用" },
      { label: "Data Status", href: "/data-status", status: "可用" }
    ]
  },
  {
    id: "income",
    title: "收入成長助理",
    short_title: "收入",
    href: "/income-lab",
    purpose: "公司裡負責把 Mark 的專業服務、舊客回流、內容產品與 App 顧問服務轉成可執行收入行動的成長助理。",
    status: "7-day income sprint 建置中",
    risk: "watch",
    pending: "收入任務需要 Mark review，不自動發訊息、不自動上架。",
    missing: ["可服務時段", "舊客名單", "服務價格確認", "可公開案例"],
    recent: "最快方向是高單價專業服務、舊客回流與期末考內容產品化。",
    next_action: "到 Income Lab 選今天 3 個不花錢任務。",
    completed: ["收入成長入口已加入助理系統", "7-day sprint 方向已定義", "所有外部訊息維持草稿"],
    review_items: ["確認服務價格", "確認舊客回訪名單", "確認內容產品是否可公開"],
    ask_examples: ["我怎麼賺更多錢？", "今天可以做哪些不花錢收入任務？", "怎麼補回本月警訊支出？"],
    memory_items: ["收入偏弱", "基本月現金需求約 51,319–56,319", "支出抵銷要對應回收行動"],
    reminder_rules: ["收入任務只建草稿", "不自動傳訊息給客戶", "不花錢優先"],
    nodes: [
      { label: "Income Lab", href: "/income-lab", status: "建置中" },
      { label: "舊客回流", href: "/income-lab", status: "草稿" },
      { label: "內容產品化", href: "/income-lab", status: "草稿" }
    ]
  },
  {
    id: "safety",
    title: "安全稽核助理",
    short_title: "安全",
    href: "/safety-center",
    purpose: "公司裡負責禁止事項、audit logs、系統狀態與成本守門的安全稽核助理。",
    status: "安全規則已啟用",
    risk: "watch",
    pending: "Cloud cost guard watch",
    missing: ["Billing Console service breakdown"],
    recent: "不啟用 functions / LINE reply / paid OCR / market data。",
    next_action: "查看 Safety Center 和 System Status。",
    completed: ["安全中心", "雲端成本守門", "LINE / functions / 外部行動禁止規則"],
    review_items: ["確認雲端成本 breakdown", "確認是否需要 LINE reply 批准", "確認是否要開付費 OCR"],
    ask_examples: ["現在系統安全嗎？", "哪些外部動作被禁止？", "雲端成本要怎麼控？"],
    memory_items: ["不啟用 LINE reply / push", "不自動交易付款下單", "不讀取或輸出 secret", "所有重要建議都需 Mark review"],
    reminder_rules: ["提到外部行動時提醒禁止", "提到 secret 時提醒不可輸出", "提到付費服務時提醒成本審核"],
    nodes: [
      { label: "安全中心", href: "/safety-center", status: "已啟用" },
      { label: "系統狀態", href: "/system-status", status: "可用" },
      { label: "稽核紀錄", href: "/audit-logs", status: "可檢查" }
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
  if (/排程|行程|提醒|匯報|報告|定時|分派|員工|公司|記住|追蹤/.test(question)) return "operations";
  if (/考|期末|ROM|MMT|講義|題庫|讀書|國考|TENS|震波|牽引|肌肉電刺激|操作治療|外科|怎麼讀|重點/.test(question)) return "exam";
  if (/收入|賺錢|高收入|提高收入|舊客|回流|現金流|賺更多|接案|服務方案|產品化/.test(question)) return "income";
  if (/助理系統|宇宙圖|看不懂|完成|進度|缺什麼|需要確認|新世代|介面|首頁/.test(question)) return "assistant_system";
  if (/花錢|支出|信用卡|分期|現金|財務|風險|可以花|能不能花|值得嗎|買東西/.test(question)) return "finance";
  if (/股票|投資|加碼|攤平|NVDA|MU|台積電|鴻海|停損|目標價|買進|賣出/.test(question)) return "investment";
  if (/客戶|課表|訓練|按摩|疼|痛|下次課|學生/.test(question)) return "client";
  if (/App|產品|Codex|功能|deploy|開發|網站|按鈕|頁面/.test(question)) return "product";
  return "general";
}

function buildAssistantAnswerCore(question: string): AssistantAnswer {
  const mode = inferAssistantMode(question);
  const baseLinks = [{ label: "審核佇列", href: "/review-queue" }];
  if (mode === "investment") {
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: "不能給單一買賣指令或加碼指令。現在只能做條件式投資 review。",
        priority: "先補目標價、停損點、加碼條件與減碼條件。",
        risk: "目前現金流偏緊，投資決策仍 waiting_review，average_down_allowed=false。",
        next_step: "到 investment-decisions 檢查標的，先處理虧損或題材股。",
        draft_available: "可建立投資 review draft，但不會下單。",
        links: [{ label: "投資決策", href: "/investment-decisions" }, ...baseLinks]
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
        links: [{ label: "期末考整理", href: "/exam-review" }, { label: "內容工作室", href: "/content-studio" }]
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
        links: [{ label: "助理首頁", href: "/assistant" }, { label: "公司宇宙", href: "/assistant-universe" }, { label: "今天", href: "/today" }]
      },
      review_dashboard: buildAssistantReviewDashboard(),
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_external_automation"]
    };
  }
  if (mode === "finance") {
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: "現在不是完全不能花，但只能做必要支出；新增高額分期、抽賞玩具、非必要大額購物都應暫停。",
        priority: "先看本月警訊支出、信用卡 / 分期 watch、基本月現金需求，再決定這筆支出是否必要。",
        risk: "收入仍偏弱，固定支出加生活費已高於目前月收入；信用卡、分期與 Line Pay 警訊支出需要 review。",
        next_step: "如果是必要支出，先到 Intake 建立 draft；如果是娛樂或測試支出，先到 Review Queue 做支出審核。",
        draft_available: "可建立 finance decision draft 或 warning spending review，不會付款、不會下單。",
        links: [{ label: "今天財務狀態", href: "/today" }, { label: "支出警訊", href: "/expense-signals" }, { label: "審核佇列", href: "/review-queue" }]
      },
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_auto_payment", "no_new_installment_without_review"]
    };
  }
  if (mode === "operations") {
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: "公司助理第一版會先在網站內完成分工、排程、匯報與待回答問題，不急著接外部推播。",
        priority: "讓每位助理員工都有負責案件、下一次匯報、需要 Mark 回答的問題。",
        risk: "LINE、付款、交易、外部傳訊都不能自動啟用；定時匯報先顯示在 /assistant。",
        next_step: "看下方公司營運卡，先處理警訊支出、投資條件、期末考內容與雲端成本。",
        draft_available: "可建立排程 / 報告 / 任務草稿，全部需要 Mark review。",
        links: [{ label: "助理首頁", href: "/assistant" }, { label: "公司宇宙", href: "/assistant-universe" }, { label: "輸入中心", href: "/intake" }]
      },
      ops_dashboard: buildAssistantOpsDashboard(),
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_line_push_without_approval", "no_external_automation"]
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
        links: [{ label: "客戶課表", href: "/client-ops" }, { label: "輸入中心", href: "/intake" }]
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
        links: [{ label: "指揮腦", href: "/command-brain" }, { label: "產品路線圖", href: "/product-roadmap" }]
      },
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_functions_deploy"]
    };
  }
  if (mode === "income") {
    const taskSummary = todayIncomeTasks.map((task) => `${task.title}（${task.timeBox}）：${task.action}`).join("；");
    return {
      mode: "structured_rule_based",
      sections: {
        current_judgment: `提高收入比新增支出更優先；今天先做 Income Lab 已定義的 ${todayIncomeTasks.length} 個不花錢任務。`,
        priority: taskSummary,
        risk: "不能自動傳訊息、不能保證成交；所有話術與 offer 都只建立草稿給 Mark review。",
        next_step: `到 Income Lab 看 7-day sprint；本週第一步是 ${sevenDaySprint[0]}`,
        draft_available: "可建立收入行動草稿、舊客回訪草稿、內容產品化草稿。",
        links: [{ label: "Income Lab", href: "/income-lab" }, { label: "Client Ops", href: "/client-ops" }, ...baseLinks]
      },
      safety_flags: ["external_action_allowed=false", "need_mark_review=true", "no_auto_customer_message"]
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
      links: [{ label: "今天", href: "/today" }, { label: "輸入中心", href: "/intake" }, ...baseLinks]
    },
    safety_flags: ["external_action_allowed=false", "need_mark_review=true", "structured_assistant_mode"]
  };
}

export function buildAssistantAnswer(question: string): AssistantAnswer {
  const answer = buildAssistantAnswerCore(question);
  const time = getTimeContext();
  return {
    ...answer,
    sections: {
      ...answer.sections,
      current_judgment: `${time.currentDate} ${time.partOfDay} ${time.currentTime}（${time.timeZone}）：${answer.sections.current_judgment}`,
      next_step: `${answer.sections.next_step} 這個判斷以「今天 ${time.currentDate}」為基準。`
    },
    safety_flags: [...new Set([...answer.safety_flags, "time_context=Asia/Taipei"])]
  };
}

export function latestFinanceStatus(signals: ExpenseSignal[]) {
  return signals[0]?.threshold_status ?? "watch";
}
