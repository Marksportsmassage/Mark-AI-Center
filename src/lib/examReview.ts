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
  docs: Array<{ label: string; path: string; kind: "原題" | "講義重點，非原題" | "索引" | "待補" }>;
}

export const examSubjects: ExamSubject[] = [
  {
    id: "surgery",
    title: "外科學",
    href: "/exam-review/surgery",
    completion: "0%",
    status: "外科題目 PDF 尚未找到，保留題庫框架。",
    files: [],
    missing: ["外科題目AI(1).pdf"],
    docs: [
      { label: "外科題庫", path: "docs/exam-review/surgery/surgery-question-bank.md", kind: "待補" },
      { label: "外科答案", path: "docs/exam-review/surgery/surgery-answer-key.md", kind: "待補" },
      { label: "考前 30 分鐘", path: "docs/exam-review/surgery/surgery-final-30min-review.md", kind: "待補" }
    ]
  },
  {
    id: "physical-modality",
    title: "物理因子治療學",
    href: "/exam-review/physical-modality",
    completion: "partial",
    status: "震波 PDF 已抽文字；HIFEM 尚未找到。",
    files: ["06震波.pdf"],
    missing: ["高強度聚焦磁場治療(1).pdf"],
    docs: [
      { label: "震波重點", path: "docs/exam-review/physical-modality/shockwave-high-yield-review.md", kind: "講義重點，非原題" },
      { label: "HIFEM 重點", path: "docs/exam-review/physical-modality/hifem-high-yield-review.md", kind: "待補" },
      { label: "比較表", path: "docs/exam-review/physical-modality/physical-modality-comparison-table.md", kind: "索引" }
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
    docs: [
      { label: "來源索引", path: "docs/exam-review/operation-therapy/operation-therapy-source-index.md", kind: "索引" },
      { label: "上肢", path: "docs/exam-review/operation-therapy/operation-therapy-upper-limb.md", kind: "講義重點，非原題" },
      { label: "下肢", path: "docs/exam-review/operation-therapy/operation-therapy-lower-limb.md", kind: "講義重點，非原題" }
    ]
  },
  {
    id: "rom-mmt",
    title: "ROM / MMT",
    href: "/exam-review/rom-mmt",
    completion: "partial",
    status: "MMT 上肢 / 下肢已抽文字；ROM 題庫尚未找到。",
    files: ["MMT小考上肢(ans).pdf", "MMT小考下肢(ans)(1).pdf"],
    missing: ["易大師的期末ROM題庫-保母級.pdf"],
    docs: [
      { label: "MMT 上肢", path: "docs/exam-review/mmt/mmt-upper-limb-muscle-actions.md", kind: "講義重點，非原題" },
      { label: "MMT 下肢", path: "docs/exam-review/mmt/mmt-lower-limb-muscle-actions.md", kind: "講義重點，非原題" },
      { label: "ROM 題庫", path: "docs/exam-review/rom/rom-question-bank.md", kind: "待補" }
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

