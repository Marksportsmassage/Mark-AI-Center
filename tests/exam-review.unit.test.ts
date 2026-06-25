import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { examSubjects, readExamDoc } from "../src/lib/examReview";
import { examReviewTopics, matchExamReviewTopics } from "../src/lib/examSummary";

describe("exam review docs", () => {
  it("has all subject docs and no empty markdown files", () => {
    expect(examSubjects.length).toBe(4);
    for (const subject of examSubjects) {
      expect(existsSync(`public${subject.visual_href}`)).toBe(true);
      expect(existsSync(subject.slide_doc)).toBe(true);
      for (const doc of subject.docs) {
        expect(existsSync(doc.path)).toBe(true);
        expect(readFileSync(doc.path, "utf8").trim().length).toBeGreaterThan(20);
      }
    }
  });

  it("lists missing materials", () => {
    const missing = readExamDoc("docs/exam-review/missing-materials.md");
    expect(missing).toContain("高強度聚焦磁場治療");
    expect(missing).not.toContain("外科題目AI.pdf");
    expect(missing).not.toContain("易大師的期末ROM題庫-保母級.pdf");
  });

  it("uses source-extracted surgery questions without fabricated answer format", () => {
    const surgery = readExamDoc("docs/exam-review/surgery/surgery-question-bank.md");
    expect(surgery).toContain("Source file: 外科題目AI.pdf");
    expect(surgery).toContain("原題抽取");
    expect(surgery).not.toContain("Correct answer: A");
  });

  it("has source-backed exam assistant summaries", () => {
    expect(examReviewTopics.length).toBe(4);
    const tens = matchExamReviewTopics("TENS 怎麼讀");
    expect(tens.some((topic) => topic.id === "physical-modality")).toBe(true);
    const all = matchExamReviewTopics("我要準備期末考");
    expect(all.length).toBe(4);
    expect(all.every((topic) => topic.artifacts.some((artifact) => artifact.kind === "圖片總整理"))).toBe(true);
  });
});
