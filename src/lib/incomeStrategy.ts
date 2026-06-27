export type IncomeTask = {
  id: string;
  title: string;
  timeBox: string;
  expectedImpact: string;
  action: string;
};

export const todayIncomeTasks: IncomeTask[] = [
  {
    id: "offer",
    title: "整理高單價服務 offer",
    timeBox: "30 分鐘",
    expectedImpact: "建立可收 2,800-8,800 TWD 的服務方案",
    action: "寫出單次體驗、4 次套裝、8 次改善方案。"
  },
  {
    id: "reactivation",
    title: "列 10 位舊客回流名單",
    timeBox: "20 分鐘",
    expectedImpact: "2 位回流即可抵銷多數小額雲端與警訊支出",
    action: "只建立訊息草稿，不自動發送。"
  },
  {
    id: "content",
    title: "發想 3 篇專業內容",
    timeBox: "30 分鐘",
    expectedImpact: "建立信任與未來內容產品素材",
    action: "用期末考 / 專業知識轉成短文或教學提綱。"
  }
];

export const sevenDaySprint = [
  "Day 1: 整理 offer、舊客名單、3 篇內容題目。",
  "Day 2: 完成 4 次套裝與 8 次改善方案文案。",
  "Day 3: Mark 審核舊客回訪草稿。",
  "Day 4: 發布 1 篇專業內容，記錄詢問。",
  "Day 5: 整理期末考內容產品規格。",
  "Day 6: 建立 AI 助理作品集案例草稿。",
  "Day 7: 結算本週新增詢問、預約、收入與抵銷支出。"
];

export const noGoIncomeRules = [
  "不自動傳訊息給客戶。",
  "不保證收入或療效。",
  "不新增付費廣告。",
  "不把一番賞娛樂支出當作資產。",
  "不啟用 LINE push / reply。"
];

export const todayNoCostIncomeActions = {
  thirtyMinutes: [
    "寫出單次 2,800-3,800、4 次 9,800-13,800、8 次 18,800-28,800 的服務 offer 草稿。",
    "列出 10 位舊客，先不傳訊息。",
    "選 3 個短影片題目：肩頸緊、髖活動度、痠痛回來。"
  ],
  twoHours: [
    "完成一頁高單價服務方案。",
    "建立舊客回流板：姓名、狀況、草稿、Mark 是否批准。",
    "寫完 3 支短影片與 3 個動畫圖解腳本。",
    "設定 11,840 警訊支出的回收行動。"
  ]
};

export const shortVideoScripts = [
  {
    title: "肩頸一直緊，先看這三件事",
    hook: "肩頸一直緊，不一定是你不夠放鬆。",
    outline: "負荷、動作模式、恢復三件事一起看。",
    cta: "想知道是哪一段卡住，可以先做一次狀態評估。"
  },
  {
    title: "為什麼放鬆後又緊回來",
    hook: "放鬆只是第一步。",
    outline: "如果日常負荷與動作沒變，緊繃可能又回來。",
    cta: "4 次改善方案會把放鬆、動作與回家練習放在一起。"
  },
  {
    title: "我整理了 3 種服務方案",
    hook: "不是每個人都需要一樣的處理方式。",
    outline: "單次評估、4 次改善、8 次追蹤各自適合不同情境。",
    cta: "想知道自己適合哪一種，可以先讓我幫你判斷。"
  }
];

export const expenseOffsetTargets = [
  "Firebase USD 25：一個小型產品銷售或一堂服務即可抵銷。",
  "Line Pay 警訊支出 11,840：一個 4 次套裝、兩次高單價服務或四次較低價服務抵銷。",
  "基本月現金流缺口：需要穩定回流客與套裝服務，不靠單次小商品。"
];
