import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { examSubjects, readExamDoc } from "../src/lib/examReview";

describe("exam review docs", () => {
  it("has all subject docs and no empty markdown files", () => {
    expect(examSubjects.length).toBe(4);
    for (const subject of examSubjects) {
      for (const doc of subject.docs) {
        expect(existsSync(doc.path)).toBe(true);
        expect(readFileSync(doc.path, "utf8").trim().length).toBeGreaterThan(20);
      }
    }
  });

  it("lists missing materials", () => {
    const missing = readExamDoc("docs/exam-review/missing-materials.md");
    expect(missing).toContain("外科題目AI");
    expect(missing).toContain("易大師");
  });

  it("does not claim missing source content is original question", () => {
    const surgery = readExamDoc("docs/exam-review/surgery/surgery-question-bank.md");
    expect(surgery).toContain("source missing");
    expect(surgery).not.toContain("Correct answer: A");
  });
});

