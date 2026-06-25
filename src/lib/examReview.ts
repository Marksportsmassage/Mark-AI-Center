import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface ExamSubject {
  id: string;
  title: string;
  href: string;
  completion: string;
  status: string;
  files: string[];
  missing: string[];
  visual_href: string;
  slide_doc: string;
  needs_review: string[];
  docs: Array<{ label: string; path: string; kind: "原題" | "講義重點，非原題" | "索引" | "圖片總整理" | "簡報式總整理" | "待補" }>;
}

export const examSubjects: ExamSubject[] = [
  {
    id: "surgery",
    title: "外科學",
    href: "/exam-review/surgery",
    completion: "partial",
    status: "外科題目已找到並抽出 29 題選擇題；考點以外題需 Mark 考前確認。",
    files: ["外科題目AI.pdf"],
    missing: ["外科完整講義或老師畫重點，如有"],
    visual_href: "/exam-review/visuals/surgery-map.svg",
    slide_doc: "docs/exam-review/slides/surgery-slide-summary.md",
    needs_review: ["PDF 內標示考點以外的題目與解析需 Mark 考前確認"],
    docs: [
      { label: "外科題庫", path: "docs/exam-review/surgery/surgery-question-bank.md", kind: "原題" },
      { label: "外科答案", path: "docs/exam-review/surgery/surgery-answer-key.md", kind: "原題" },
      { label: "外科高頻重點", path: "docs/exam-review/surgery/surgery-high-yield-review.md", kind: "講義重點，非原題" },
      { label: "考前 30 分鐘", path: "docs/exam-review/surgery/surgery-final-30min-review.md", kind: "索引" },
      { label: "簡報式總整理", path: "docs/exam-review/slides/surgery-slide-summary.md", kind: "簡報式總整理" }
    ]
  },
  {
    id: "physical-modality",
    title: "物理因子治療學",
    href: "/exam-review/physical-modality",
    completion: "partial",
    status: "TENS、肌肉電刺激、脊椎牽引、震波已抽文字；HIFEM 尚未找到。",
    files: ["04TENS 2.pdf", "05肌肉電刺激 2.pdf", "05脊椎牽引概論與臨床運用 2.pdf", "06震波.pdf"],
    missing: ["高強度聚焦磁場治療(1).pdf"],
    visual_href: "/exam-review/visuals/physical-modality-map.svg",
    slide_doc: "docs/exam-review/slides/physical-modality-slide-summary.md",
    needs_review: ["HIFEM 尚未提供；其他物理因子若有老師畫重點需補"],
    docs: [
      { label: "震波重點", path: "docs/exam-review/physical-modality/shockwave-high-yield-review.md", kind: "講義重點，非原題" },
      { label: "TENS 重點", path: "docs/exam-review/physical-modality/tens-high-yield-review.md", kind: "講義重點，非原題" },
      { label: "肌肉電刺激重點", path: "docs/exam-review/physical-modality/muscle-stimulation-high-yield-review.md", kind: "講義重點，非原題" },
      { label: "脊椎牽引重點", path: "docs/exam-review/physical-modality/traction-high-yield-review.md", kind: "講義重點，非原題" },
      { label: "HIFEM 重點", path: "docs/exam-review/physical-modality/hifem-high-yield-review.md", kind: "待補" },
      { label: "比較表", path: "docs/exam-review/physical-modality/physical-modality-comparison-table.md", kind: "索引" },
      { label: "簡報式總整理", path: "docs/exam-review/slides/physical-modality-slide-summary.md", kind: "簡報式總整理" }
    ]
  },
  {
    id: "operation-therapy",
    title: "操作治療學",
    href: "/exam-review/operation-therapy",
    completion: "indexed",
    status: "四肢 1/2 為掃描型，已建立索引；跑台考題可抽文字。",
    files: ["操作治療學(四肢)1.pdf", "操作治療學(四肢)2.pdf", "114學年度＿專物一甲操作治療學及實習跑台技術考考題.pdf"],
    missing: ["清晰文字版或可 OCR 版本，如 Mark 有"],
    visual_href: "/exam-review/visuals/operation-therapy-map.svg",
    slide_doc: "docs/exam-review/slides/operation-therapy-slide-summary.md",
    needs_review: ["四肢 1/2 為掃描圖，需 Mark 或人工 OCR 確認操作細節"],
    docs: [
      { label: "來源索引", path: "docs/exam-review/operation-therapy/operation-therapy-source-index.md", kind: "索引" },
      { label: "跑台技術考題", path: "docs/exam-review/operation-therapy/operation-therapy-run-station-question-bank.md", kind: "原題" },
      { label: "上肢", path: "docs/exam-review/operation-therapy/operation-therapy-upper-limb.md", kind: "講義重點，非原題" },
      { label: "下肢", path: "docs/exam-review/operation-therapy/operation-therapy-lower-limb.md", kind: "講義重點，非原題" },
      { label: "簡報式總整理", path: "docs/exam-review/slides/operation-therapy-slide-summary.md", kind: "簡報式總整理" }
    ]
  },
  {
    id: "rom-mmt",
    title: "ROM / MMT",
    href: "/exam-review/rom-mmt",
    completion: "partial",
    status: "MMT 上肢 / 下肢與 ROM 題庫已抽文字；ROM 講義是掃描型需人工 OCR。",
    files: ["MMT小考上肢(ans).pdf", "MMT小考下肢(ans)(1).pdf", "易大師的期末ROM題庫-保母級.pdf", "ROM講義.pdf", "MMT期末跑台圖0612 2.pdf"],
    missing: ["ROM講義.pdf 文字 OCR 或人工確認"],
    visual_href: "/exam-review/visuals/rom-mmt-map.svg",
    slide_doc: "docs/exam-review/slides/rom-mmt-slide-summary.md",
    needs_review: ["ROM 講義與跑台圖是圖像來源，需 Mark 對照確認"],
    docs: [
      { label: "MMT 上肢", path: "docs/exam-review/mmt/mmt-upper-limb-muscle-actions.md", kind: "講義重點，非原題" },
      { label: "MMT 下肢", path: "docs/exam-review/mmt/mmt-lower-limb-muscle-actions.md", kind: "講義重點，非原題" },
      { label: "MMT 跑台圖索引", path: "docs/exam-review/mmt/mmt-run-station-guide.md", kind: "講義重點，非原題" },
      { label: "ROM 題庫", path: "docs/exam-review/rom/rom-question-bank.md", kind: "原題" },
      { label: "ROM 跑台題目", path: "docs/exam-review/rom/rom-run-station-question-bank.md", kind: "原題" },
      { label: "ROM 測量指引", path: "docs/exam-review/rom/rom-run-station-measurement-guide.md", kind: "講義重點，非原題" },
      { label: "ROM Norkin 重點", path: "docs/exam-review/rom/rom-norkin-high-yield.md", kind: "講義重點，非原題" },
      { label: "簡報式總整理", path: "docs/exam-review/slides/rom-mmt-slide-summary.md", kind: "簡報式總整理" }
    ]
  }
];

export function readExamDoc(relativePath: string) {
  const file = path.join(process.cwd(), relativePath);
  if (!existsSync(file)) return "尚未建立。";
  return readFileSync(file, "utf8");
}

export function excerptMarkdown(markdown: string, max = 1800) {
  const text = markdown.replace(/^# .*\n/, "").trim();
  return text.length > max ? `${text.slice(0, max)}\n\n...（已截斷，請看 repo docs 完整內容）` : text;
}
