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
