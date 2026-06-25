import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mobile navigation", () => {
  it("contains Assistant / Today / Intake / Review / Universe labels", () => {
    const source = readFileSync("src/components/MobileBottomNav.tsx", "utf8");
    for (const label of ["助理", "今天", "輸入", "審核", "宇宙圖"]) {
      expect(source).toContain(label);
    }
  });
});
