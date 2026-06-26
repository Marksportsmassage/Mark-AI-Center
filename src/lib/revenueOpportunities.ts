export type RevenueOpportunity = {
  id: string;
  title: string;
  expectedRange: string;
  why: string;
  steps: string[];
  draft: string;
};

export const revenueOpportunities: RevenueOpportunity[] = [
  {
    id: "premium-service",
    title: "高單價專業服務",
    expectedRange: "2,800-16,800 TWD / 客",
    why: "Mark 已有專業能力，最快變現是包裝服務而不是新增成本。",
    steps: ["單次高品質體驗", "4 次套裝", "8 次改善方案", "每個方案寫清楚目標與適合對象"],
    draft: "我最近整理了一個更完整的身體狀態評估與改善方案，如果你想把近期卡住的狀況系統化處理，我可以先幫你做一次完整評估。"
  },
  {
    id: "client-reactivation",
    title: "舊客戶回流",
    expectedRange: "2 位回流約 5,600-17,600 TWD",
    why: "舊客信任成本最低，不需要廣告費。",
    steps: ["列 10 位舊客", "標註近況", "建立草稿", "Mark 審核後才發送"],
    draft: "最近我在整理更系統化的訓練 / 放鬆方案，想到你之前的狀況。如果你最近還有卡住的地方，我可以幫你安排一次回顧。"
  },
  {
    id: "exam-product",
    title: "期末 / 國考內容產品化",
    expectedRange: "199-999 TWD / 份或小課",
    why: "已整理 MMT、震波、操作治療等素材，可轉成表格、小課或題庫。",
    steps: ["整理商品規格", "確認可公開素材", "建立 sample", "Mark 審核定價"],
    draft: "ROM/MMT 考前 30 分鐘複習包：重點表格、易錯點、跑台提醒。"
  },
  {
    id: "assistant-commercial",
    title: "AI 助理系統產品化",
    expectedRange: "5,000-30,000 TWD / 顧問案",
    why: "Mark AI Center 可作為作品集，展示個人營運系統建置能力。",
    steps: ["整理 demo", "寫案例文", "列出可幫別人做的版本", "只接小型顧問測試"],
    draft: "我正在把個人工作流、財務、學習與客戶管理整理成 AI 助理系統，可以協助小型個人品牌做第一版。"
  },
  {
    id: "body-state-app",
    title: "身境 / App 商業化",
    expectedRange: "pilot 0-10,000 TWD",
    why: "先做小型客戶測試，確認真需求再擴張。",
    steps: ["定義 pilot", "找 1-3 位測試者", "收回饋", "不先燒錢"],
    draft: "受控試用：只收小樣本回饋，不承諾醫療效果。"
  },
  {
    id: "expense-offset",
    title: "支出抵銷方案",
    expectedRange: "11,840 TWD offset target",
    why: "把 Line Pay 警訊支出、Firebase 成本、信用卡壓力轉成對應回收行動。",
    steps: ["每筆支出配一個回收行動", "先不新增同類支出", "追蹤 7 天內可回收金額"],
    draft: "本週目標：用 2 個高單價時段或 4 次舊客回流抵銷 11,840 警訊支出。"
  }
];
