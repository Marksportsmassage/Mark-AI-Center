import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expenseOffsetTargets, noGoIncomeRules, sevenDaySprint, shortVideoScripts, todayIncomeTasks, todayNoCostIncomeActions } from "../src/lib/incomeStrategy";
import { revenueOpportunities } from "../src/lib/revenueOpportunities";

describe("income lab", () => {
  it("route exists and shows review-gated income actions", () => {
    expect(existsSync("src/app/income-lab/page.tsx")).toBe(true);
    const source = readFileSync("src/app/income-lab/page.tsx", "utf8");
    expect(source).toContain("收入成長行動室");
    expect(source).toContain("今天 3 個收入任務");
    expect(source).toContain("今天不花錢收入行動");
    expect(source).toContain("短影片 / 動畫腳本");
    expect(source).toContain("本週收入 Sprint");
    expect(noGoIncomeRules).toContain("不自動傳訊息給客戶。");
  });

  it("has concrete no-cost tasks and opportunities", () => {
    expect(todayIncomeTasks.length).toBe(3);
    expect(sevenDaySprint.length).toBe(7);
    expect(todayNoCostIncomeActions.thirtyMinutes.length).toBeGreaterThanOrEqual(3);
    expect(shortVideoScripts.length).toBeGreaterThanOrEqual(3);
    expect(expenseOffsetTargets.join(" ")).toContain("11,840");
    expect(revenueOpportunities.length).toBeGreaterThanOrEqual(5);
    expect(noGoIncomeRules).toContain("不自動傳訊息給客戶。");
  });
});
