export type ExamCompletion = "done" | "partial" | "needs_review" | "missing";

export interface ExamReviewArtifact {
  label: string;
  href: string;
  kind: "題庫" | "講義重點" | "圖片總整理" | "簡報式總整理" | "待確認";
}

export interface ExamReviewTopic {
  id: string;
  title: string;
  subject: string;
  completion: ExamCompletion;
  source: string;
  status: string;
  whatIsReady: string[];
  needsMarkReview: string[];
  artifacts: ExamReviewArtifact[];
  keywords: string[];
}

export const examReviewTopics: ExamReviewTopic[] = [
  {
    id: "surgery",
    title: "外科學題庫",
    subject: "外科學",
    completion: "partial",
    source: "外科題目AI.pdf",
    status: "已抽出 29 題選擇題與簡答題區段；PDF 內標成考點以外的內容需 Mark 考前確認。",
    whatIsReady: ["29 題選擇題", "答案表", "高頻重點", "考前 30 分鐘複習"],
    needsMarkReview: ["PDF 中標示考點以外的解析", "是否有外科完整講義或老師畫重點"],
    artifacts: [
      { label: "外科題庫", href: "/exam-review/surgery", kind: "題庫" },
      { label: "外科圖片總整理", href: "/exam-review/surgery#visual-summary", kind: "圖片總整理" },
      { label: "外科簡報式總整理", href: "/exam-review/surgery#slide-summary", kind: "簡報式總整理" }
    ],
    keywords: ["外科", "小兒", "舌繫帶", "斜頸", "闌尾炎", "甲狀腺", "骨折", "ISS"]
  },
  {
    id: "rom-mmt",
    title: "ROM / MMT",
    subject: "ROM / MMT",
    completion: "partial",
    source: "易大師 ROM 題庫、ROM 講義、MMT 上下肢答案、跑台圖",
    status: "ROM 題庫與 MMT 答案可抽文字；ROM 講義與部分圖像資料為掃描，需要以圖片索引與人工確認處理。",
    whatIsReady: ["ROM Norkin 題庫", "ROM 跑台 14 題與評分規則", "ROM 測量指引文字索引", "MMT 上肢肌肉/神經", "MMT 下肢肌肉/神經", "MMT 跑台圖文字索引", "考前 30 分鐘複習"],
    needsMarkReview: ["ROM 講義掃描頁", "跑台圖與測量指引的圖像標記需人工核對", "易大師題庫中抽不到文字的頁面"],
    artifacts: [
      { label: "ROM / MMT 整理", href: "/exam-review/rom-mmt", kind: "題庫" },
      { label: "ROM / MMT 圖片總整理", href: "/exam-review/rom-mmt#visual-summary", kind: "圖片總整理" },
      { label: "ROM / MMT 簡報式總整理", href: "/exam-review/rom-mmt#slide-summary", kind: "簡報式總整理" }
    ],
    keywords: ["ROM", "MMT", "Norkin", "MCP", "PIP", "DIP", "髖", "膝", "踝", "上肢", "下肢"]
  },
  {
    id: "physical-modality",
    title: "物理因子治療學",
    subject: "物理因子治療學",
    completion: "partial",
    source: "04TENS 2.pdf、05肌肉電刺激 2.pdf、05脊椎牽引概論與臨床運用 2.pdf、06震波.pdf",
    status: "TENS、肌肉電刺激、脊椎牽引、震波已抽文字並整理；HIFEM 仍缺檔。",
    whatIsReady: ["TENS 止痛機轉與參數", "肌肉電刺激參數", "脊椎牽引分類與臨床運用", "震波定義、機轉、類型"],
    needsMarkReview: ["高強度聚焦磁場治療 HIFEM 檔案", "老師是否有其他物理因子 PPT"],
    artifacts: [
      { label: "物理因子整理", href: "/exam-review/physical-modality", kind: "講義重點" },
      { label: "物理因子圖片總整理", href: "/exam-review/physical-modality#visual-summary", kind: "圖片總整理" },
      { label: "物理因子簡報式總整理", href: "/exam-review/physical-modality#slide-summary", kind: "簡報式總整理" }
    ],
    keywords: ["TENS", "肌肉電刺激", "牽引", "震波", "shockwave", "電刺激", "HIFEM"]
  },
  {
    id: "operation-therapy",
    title: "操作治療學",
    subject: "操作治療學",
    completion: "needs_review",
    source: "操作治療四肢 1/2、114 學年度跑台技術考考題",
    status: "四肢講義為掃描型，不能硬編；跑台考題 20 題可抽文字並建立技術操作索引。",
    whatIsReady: ["跑台技術考 20 題", "操作治療來源索引", "上肢/下肢待整理框架", "人工確認清單"],
    needsMarkReview: ["操作治療四肢 1/2 清晰版或人工 OCR", "跑台操作流程是否依老師講義為準"],
    artifacts: [
      { label: "操作治療整理", href: "/exam-review/operation-therapy", kind: "題庫" },
      { label: "操作治療圖片總整理", href: "/exam-review/operation-therapy#visual-summary", kind: "圖片總整理" },
      { label: "操作治療簡報式總整理", href: "/exam-review/operation-therapy#slide-summary", kind: "簡報式總整理" }
    ],
    keywords: ["操作治療", "四肢", "跑台", "關節鬆動", "被動關節活動", "PNF", "按摩"]
  }
];

export function matchExamReviewTopics(question: string) {
  const normalized = question.toLowerCase();
  const matches = examReviewTopics.filter((topic) =>
    topic.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())) ||
    normalized.includes(topic.subject.toLowerCase()) ||
    normalized.includes(topic.title.toLowerCase())
  );
  if (matches.length > 0) return matches;
  if (/考|期末|講義|題庫|複習|讀書/.test(question)) return examReviewTopics;
  return [];
}

export function getExamProductionSummary() {
  return {
    readyCount: examReviewTopics.filter((topic) => topic.completion === "done" || topic.completion === "partial").length,
    needsReviewCount: examReviewTopics.filter((topic) => topic.needsMarkReview.length > 0).length,
    readyItems: examReviewTopics.flatMap((topic) => topic.whatIsReady.map((item) => `${topic.subject}: ${item}`)),
    reviewItems: examReviewTopics.flatMap((topic) => topic.needsMarkReview.map((item) => `${topic.subject}: ${item}`))
  };
}
