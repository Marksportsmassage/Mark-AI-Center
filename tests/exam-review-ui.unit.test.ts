import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("exam review UI", () => {
  it("routes exist", () => {
    expect(existsSync("src/app/exam-review/page.tsx")).toBe(true);
    expect(existsSync("src/app/exam-review/[subject]/page.tsx")).toBe(true);
  });

  it("shows labels that distinguish source types", () => {
    const page = readFileSync("src/app/exam-review/[subject]/page.tsx", "utf8");
    expect(page).toContain("原題");
    expect(page).toContain("講義重點");
    expect(page).toContain("待補");
    expect(page).toContain("圖片式總整理");
    expect(page).toContain("簡報式總整理");
  });

  it("exam home shows production summary instead of only tables", () => {
    const page = readFileSync("src/app/exam-review/page.tsx", "utf8");
    expect(page).toContain("系統已製作與待確認");
    expect(page).toContain("exam-card-visual");
    expect(page).toContain("問助理讀這科");
    expect(page).toContain("ask_prompt");
  });
});
