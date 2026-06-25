import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assistantBranches, assistantBranchCompletion } from "../src/lib/assistantExperience";

describe("assistant universe", () => {
  it("route exists and nodes exist", () => {
    expect(existsSync("src/app/assistant-universe/page.tsx")).toBe(true);
    expect(assistantBranches.map((item) => item.title)).toContain("CFO 財務助理");
    expect(assistantBranches.map((item) => item.title)).toContain("內容與國考助理");
  });

  it("node helper returns drawer model", () => {
    const cfo = assistantBranches.find((item) => item.id === "cfo");
    expect(cfo?.purpose).toContain("現金流");
    expect(cfo?.nodes.some((node) => node.href === "/finance-baseline")).toBe(true);
    expect(cfo?.completed.length).toBeGreaterThan(0);
    expect(cfo?.review_items.length).toBeGreaterThan(0);
    expect(cfo?.ask_examples.some((item) => item.includes("花錢"))).toBe(true);
    expect(cfo ? assistantBranchCompletion(cfo) : 0).toBeGreaterThan(0);
  });

  it("universe page exposes completed and review sections", () => {
    const source = readFileSync("src/app/assistant-universe/page.tsx", "utf8");
    expect(source).toContain("已完成");
    expect(source).toContain("需要 Mark 確認");
    expect(source).toContain("prompt=");
    expect(source).toContain("assistant-progress");
  });
});
