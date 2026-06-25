import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assistantBranches } from "../src/lib/assistantExperience";

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
  });
});

