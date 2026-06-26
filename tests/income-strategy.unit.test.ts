import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { revenueOpportunities } from "../src/lib/revenueOpportunities";

describe("income strategy", () => {
  it("includes expected revenue opportunity categories", () => {
    const titles = revenueOpportunities.map((item) => item.title).join(" ");
    expect(titles).toContain("高單價專業服務");
    expect(titles).toContain("舊客戶回流");
    expect(titles).toContain("期末 / 國考內容產品化");
    expect(titles).toContain("AI 助理系統產品化");
    expect(titles).toContain("支出抵銷方案");
  });

  it("writes concrete income growth docs", () => {
    for (const file of [
      "docs/income-growth/income-growth-master-plan.md",
      "docs/income-growth/7-day-income-sprint.md",
      "docs/income-growth/service-offers.md",
      "docs/income-growth/client-reactivation-scripts.md",
      "docs/income-growth/content-monetization-plan.md",
      "docs/income-growth/ai-assistant-commercialization-plan.md",
      "docs/income-growth/expense-offset-plan.md"
    ]) {
      expect(existsSync(file)).toBe(true);
    }
    const plan = readFileSync("docs/income-growth/expense-offset-plan.md", "utf8");
    expect(plan).toContain("11,840");
    expect(plan).toContain("pause new installments");
  });
});
