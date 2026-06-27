import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("master index", () => {
  it("has the required docs", () => {
    for (const file of [
      "docs/master-index/mark-system-master-summary.md",
      "docs/master-index/data-map.md",
      "docs/master-index/what-mark-has-provided.md",
      "docs/master-index/what-is-still-missing.md",
      "docs/master-index/actionable-next-steps.md"
    ]) {
      expect(existsSync(file)).toBe(true);
      expect(readFileSync(file, "utf8").trim().length).toBeGreaterThan(200);
    }
  });

  it("separates provided, inferred, and missing data", () => {
    const map = readFileSync("docs/master-index/data-map.md", "utf8");
    expect(map).toContain("Provided Data");
    expect(map).toContain("Inferred Data");
    expect(map).toContain("Missing Data");
    expect(map).toContain("Blocks decisions now");
  });

  it("exposes the master index route", () => {
    const source = readFileSync("src/app/master-index/page.tsx", "utf8");
    expect(source).toContain("Mark 系統總索引");
    expect(source).toContain("AI assistant system");
    expect(source).toContain("Income Lab");
  });
});
