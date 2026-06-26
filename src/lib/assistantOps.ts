import type { AssistantRisk } from "@/lib/assistantExperience";

export type AssistantEmployeeId = "cfo" | "investment" | "client" | "content" | "business" | "product" | "safety";

export interface AssistantAssignment {
  id: string;
  title: string;
  owner: AssistantEmployeeId;
  owner_label: string;
  status: "等待 Mark 確認" | "助理整理中" | "可直接查看" | "需補資料";
  risk: AssistantRisk;
  next_step: string;
  report_cadence: string;
  next_report: string;
  need_mark_review: true;
  external_action_allowed: false;
  href: string;
}

export interface AssistantReportPlan {
  id: string;
  title: string;
  cadence: string;
  owner_label: string;
  includes: string[];
  delivery: string;
  status: "網站內可見" | "待 Mark 批准外部通知";
  external_action_allowed: false;
}

export interface ConversationalIntakeFlow {
  id: string;
  title: string;
  owner_label: string;
  trigger_examples: string[];
  questions: string[];
  output_hint: string;
  href: string;
}

export interface AssistantReviewAction {
  id: string;
  title: string;
  owner_label: string;
  reason: string;
  risk: AssistantRisk;
  href: string;
  primary_label: string;
}

export interface AssistantAnswerRequest {
  id: string;
  question: string;
  owner_label: string;
  why: string;
  placeholder: string;
  href: string;
}

export const assistantAssignments: AssistantAssignment[] = [
  {
    id: "finance-warning-spending",
    title: "本月警訊支出與信用卡壓力",
    owner: "cfo",
    owner_label: "財務長助理",
    status: "等待 Mark 確認",
    risk: "warning",
    next_step: "核對 Line Pay 11,840 與文字明細 10,900 的 940 差額，決定純娛樂或事業測試。",
    report_cadence: "每天打開助理首頁時回報",
    next_report: "今日助理首頁",
    need_mark_review: true,
    external_action_allowed: false,
    href: "/finance-decisions"
  },
  {
    id: "investment-conditions",
    title: "投資標的條件式審核",
    owner: "investment",
    owner_label: "投資風控助理",
    status: "需補資料",
    risk: "watch",
    next_step: "補 2201、2317、4749、MU、NVDA 的目標價、停損、加碼與減碼條件。",
    report_cadence: "每次問股票或加碼時回報",
    next_report: "投資問題觸發時",
    need_mark_review: true,
    external_action_allowed: false,
    href: "/investment-decisions"
  },
  {
    id: "exam-review-readiness",
    title: "期末考內容、題庫、圖片與簡報式複習",
    owner: "content",
    owner_label: "學習內容助理",
    status: "可直接查看",
    risk: "normal",
    next_step: "先看 /exam-review 的圖片式總整理，再進各科題庫與考前 30 分鐘整理。",
    report_cadence: "每天讀書前回報",
    next_report: "問期末考或打開 Exam Review 時",
    need_mark_review: true,
    external_action_allowed: false,
    href: "/exam-review"
  },
  {
    id: "assistant-product-upgrade",
    title: "新世代公司型助理介面",
    owner: "product",
    owner_label: "產品開發助理",
    status: "助理整理中",
    risk: "watch",
    next_step: "把首頁簡化成一句話輸入、3D 宇宙、分工、匯報與問答式輸入。",
    report_cadence: "每次部署前與部署後回報",
    next_report: "本次 App Hosting deploy 後",
    need_mark_review: true,
    external_action_allowed: false,
    href: "/assistant"
  },
  {
    id: "cloud-cost-watch",
    title: "Google Cloud 成本守門",
    owner: "safety",
    owner_label: "安全稽核助理",
    status: "等待 Mark 確認",
    risk: "watch",
    next_step: "維持只批次部署 App Hosting，不啟用 functions、LINE reply、付費 OCR 或市場資料。",
    report_cadence: "每次部署前提醒",
    next_report: "下次部署前",
    need_mark_review: true,
    external_action_allowed: false,
    href: "/safety-center"
  }
];

export const assistantReportPlans: AssistantReportPlan[] = [
  {
    id: "daily-command-report",
    title: "每日公司總匯報",
    cadence: "每天第一次打開 /assistant 時",
    owner_label: "Mark AI Assistant",
    includes: ["今天最重要 3 件事", "待 Mark 確認", "各員工風險", "下一步入口"],
    delivery: "先顯示在助理首頁；LINE 推播需 Mark 另外批准才可啟用。",
    status: "網站內可見",
    external_action_allowed: false
  },
  {
    id: "finance-watch-report",
    title: "財務警訊匯報",
    cadence: "每次新增支出、問能不能花錢、或打開 Today 時",
    owner_label: "財務長助理",
    includes: ["現金流", "信用卡 / 分期", "警訊支出", "不可做事項"],
    delivery: "網站內即時卡片；不自動付款、不自動交易。",
    status: "網站內可見",
    external_action_allowed: false
  },
  {
    id: "exam-study-report",
    title: "期末考讀書匯報",
    cadence: "每次問期末考或進入 Exam Review 時",
    owner_label: "學習內容助理",
    includes: ["已整理內容", "待補教材", "先讀順序", "考前 30 分鐘重點"],
    delivery: "Exam Review 與助理回答內顯示；不編造講義沒有的題目。",
    status: "網站內可見",
    external_action_allowed: false
  }
];

export const assistantReviewActions: AssistantReviewAction[] = [
  {
    id: "review-warning-spending",
    title: "確認 Line Pay / 一番賞警訊支出",
    owner_label: "財務長助理",
    reason: "目前可見支出 11,840，文字明細 10,900，還有 940 差額待核對。",
    risk: "warning",
    href: "/finance-decisions",
    primary_label: "去審核支出"
  },
  {
    id: "review-investments",
    title: "審核投資標的條件",
    owner_label: "投資風控助理",
    reason: "投資決策仍 waiting_review，缺目標價、停損點、加碼與減碼條件。",
    risk: "watch",
    href: "/investment-decisions",
    primary_label: "去審核投資"
  },
  {
    id: "review-cloud-cost",
    title: "確認雲端成本守門線",
    owner_label: "安全稽核助理",
    reason: "Google Cloud 成本已達 USD 25 watch line；部署需批次化。",
    risk: "watch",
    href: "/safety-center",
    primary_label: "查看安全中心"
  }
];

export const assistantAnswerRequests: AssistantAnswerRequest[] = [
  {
    id: "answer-spending-delta",
    question: "Line Pay 截圖 11,840 和文字明細 10,900 的 940 差額，是哪一筆？",
    owner_label: "財務長助理",
    why: "確認後才能把本月警訊支出算準，避免重複或漏記。",
    placeholder: "例如：940 是運費 / 另一筆小額消費 / 截圖包含其他項目",
    href: "/intake?flow=spending"
  },
  {
    id: "answer-spending-type",
    question: "一番賞 / 玩具支出要算純娛樂，還是事業測試？",
    owner_label: "商業實驗助理",
    why: "如果是事業測試，需要預算上限、成本表、回收價、停損線；如果不是，本月同類暫停。",
    placeholder: "例如：純娛樂，本月停止 / 事業測試，預算上限 3000",
    href: "/intake?flow=spending"
  },
  {
    id: "answer-investment-conditions",
    question: "2201、2317、4749、MU、NVDA 哪一檔先補目標價與停損？",
    owner_label: "投資風控助理",
    why: "補完條件後，助理才可以做條件式 review，不會給無條件買賣建議。",
    placeholder: "例如：先補 NVDA，目標價 ___，停損 ___",
    href: "/intake?flow=investment"
  }
];

export const conversationalIntakeFlows: ConversationalIntakeFlow[] = [
  {
    id: "spending",
    title: "支出 / 信用卡 / 分期",
    owner_label: "財務長助理",
    trigger_examples: ["我花了一筆錢", "信用卡帳單來了", "這筆要不要買"],
    questions: ["這筆金額多少？", "付款方式是現金、Line Pay、信用卡或分期？", "這是必要支出、娛樂，還是事業測試？", "有沒有回收計畫或停損線？"],
    output_hint: "會整理成 finance_decision draft，need_mark_review=true。",
    href: "/intake"
  },
  {
    id: "investment",
    title: "股票 / 投資",
    owner_label: "投資風控助理",
    trigger_examples: ["股票能不能加碼", "這檔要不要賣", "幫我 review NVDA"],
    questions: ["標的是哪一檔？", "原始買進理由是什麼？", "目標價、停損點、加碼條件是什麼？", "它是長期核心還是短期題材？"],
    output_hint: "會整理成 investment_decision draft；不會自動買賣。",
    href: "/intake"
  },
  {
    id: "exam",
    title: "期末考 / 讀書",
    owner_label: "學習內容助理",
    trigger_examples: ["我要準備期末考", "幫我整理這份講義", "題庫答案怎麼看"],
    questions: ["是哪一科？", "你要看題庫、講義重點、圖片總整理，還是考前 30 分鐘？", "有沒有老師畫重點或補充範圍？", "哪些地方需要我標成待確認？"],
    output_hint: "只整理教材裡有的內容；缺資料會標待補。",
    href: "/exam-review"
  },
  {
    id: "client",
    title: "客戶 / 課表",
    owner_label: "客戶課表助理",
    trigger_examples: ["我要整理客戶課表", "幫我寫下次訓練", "客戶今天狀態"],
    questions: ["客戶是誰？", "本次目標是什麼？", "今天做了哪些動作？", "有沒有疼痛、禁忌或注意事項？"],
    output_hint: "會建立 session note / next plan draft；不做醫療診斷。",
    href: "/client-ops"
  },
  {
    id: "product",
    title: "App / 公司助理系統",
    owner_label: "產品開發助理",
    trigger_examples: ["App 下一步做什麼", "助理系統哪裡看不懂", "我要新功能"],
    questions: ["你想解決哪個使用情境？", "你希望第一眼看到什麼？", "哪些頁面目前看不懂？", "這次是否需要部署？"],
    output_hint: "會整理成產品任務草稿；部署前會提醒成本守門。",
    href: "/product-roadmap"
  }
];

export function buildAssistantOpsDashboard() {
  return {
    headline: "公司助理會把事情分派給不同員工，先在網站內匯報；LINE 推播與外部行動都保持關閉。",
    next_reports: assistantReportPlans,
    assignments: assistantAssignments,
    review_actions: assistantReviewActions,
    answer_requests: assistantAnswerRequests,
    intake_flows: conversationalIntakeFlows,
    guardrails: ["need_mark_review=true", "external_action_allowed=false", "LINE reply / push 未啟用", "不自動交易、付款、下單或傳訊"]
  };
}

export function matchConversationalIntakeFlow(input: string) {
  const text = input.trim();
  if (/刷卡|花|支出|信用卡|分期|Line Pay|付款|消費|買東西/.test(text)) return conversationalIntakeFlows.find((flow) => flow.id === "spending")!;
  if (/股票|投資|加碼|攤平|停損|目標價|NVDA|MU|台積電|鴻海/.test(text)) return conversationalIntakeFlows.find((flow) => flow.id === "investment")!;
  if (/考|期末|讀書|講義|題庫|ROM|MMT|TENS|震波|牽引|外科/.test(text)) return conversationalIntakeFlows.find((flow) => flow.id === "exam")!;
  if (/客戶|課表|訓練|疼|痛|按摩/.test(text)) return conversationalIntakeFlows.find((flow) => flow.id === "client")!;
  if (/App|產品|系統|助理|功能|deploy|頁面/.test(text)) return conversationalIntakeFlows.find((flow) => flow.id === "product")!;
  return conversationalIntakeFlows.find((flow) => flow.id === "spending")!;
}
