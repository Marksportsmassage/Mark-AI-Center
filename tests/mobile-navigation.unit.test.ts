import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mobile navigation", () => {
  it("contains Assistant / Today / Intake / Review / Universe labels", () => {
    const source = readFileSync("src/components/MobileBottomNav.tsx", "utf8");
    for (const label of ["助理", "今天", "輸入", "審核", "宇宙圖"]) {
      expect(source).toContain(label);
    }
  });

  it("uses Chinese desktop company staff labels", () => {
    const source = readFileSync("src/app/layout.tsx", "utf8");
    for (const label of ["助理", "今天", "公司員工", "財務長助理", "投資風控", "學習內容", "安全稽核"]) {
      expect(source).toContain(label);
    }
    expect(source).not.toContain("More branches");
  });
});
