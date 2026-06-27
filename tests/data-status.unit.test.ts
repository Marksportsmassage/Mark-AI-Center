import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("data status registry", () => {
  it("has registry docs", () => {
    for (const file of [
      "docs/data-status/mark-data-status-2026-06-27.md",
      "docs/data-status/missing-data-prioritized.md",
      "docs/data-status/provided-data-registry.md",
      "docs/data-status/do-not-ask-again.md"
    ]) {
      expect(existsSync(file)).toBe(true);
      expect(readFileSync(file, "utf8").trim().length).toBeGreaterThan(200);
    }
  });

  it("prioritizes missing data and avoids repeated asks", () => {
    const missing = readFileSync("docs/data-status/missing-data-prioritized.md", "utf8");
    const doNotAsk = readFileSync("docs/data-status/do-not-ask-again.md", "utf8");
    expect(missing).toContain("Blocks Decisions Now");
    expect(missing).toContain("Useful But Not Blocking");
    expect(missing).toContain("Optional Later");
    expect(doNotAsk).toContain("first finance baseline is usable");
  });

  it("exposes the data-status route", () => {
    const source = readFileSync("src/app/data-status/page.tsx", "utf8");
    expect(source).toContain("資料狀態與缺口");
    expect(source).toContain("不要再問");
  });
});
