import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assistantBranches, assistantSuggestions, buildAssistantAnswer } from "../src/lib/assistantExperience";

describe("modern assistant redesign", () => {
  it("has dark assistant theme and reusable assistant-ui components", () => {
    expect(existsSync("src/styles/assistant-theme.css")).toBe(true);
    for (const file of [
      "AssistantShell.tsx",
      "AssistantTopBar.tsx",
      "AssistantMobileNav.tsx",
      "AssistantGlassCard.tsx",
      "AssistantHeroPanel.tsx",
      "AssistantCommandInput.tsx",
      "AssistantPriorityCard.tsx",
      "AssistantRiskCard.tsx",
      "AssistantReviewCard.tsx",
      "AssistantSuggestionPanel.tsx",
      "AssistantBranchDrawer.tsx",
      "AssistantMetricRing.tsx",
      "AssistantActionButton.tsx"
    ]) {
      expect(existsSync(`src/components/assistant-ui/${file}`)).toBe(true);
    }
    const theme = readFileSync("src/styles/assistant-theme.css", "utf8");
    expect(theme).toContain("--ai-bg");
    expect(theme).toContain("glass");
    expect(theme).toContain("radial-gradient");
  });

  it("assistant supports income and time-aware questions", () => {
    expect(assistantSuggestions.some((item) => item.href === "/income-lab")).toBe(true);
    expect(assistantBranches.some((item) => item.id === "income")).toBe(true);
    const answer = buildAssistantAnswer("我怎麼提高收入？");
    expect(answer.sections.links.some((link) => link.href === "/income-lab")).toBe(true);
    expect(answer.safety_flags).toContain("no_auto_customer_message");
  });

  it("start here exposes the simplified new generation entries", () => {
    const source = readFileSync("src/app/start-here/page.tsx", "utf8");
    expect(source).toContain("我要問 AI 助理");
    expect(source).toContain("我要看宇宙圖");
    expect(source).toContain("我要提高收入");
    expect(source).toContain("我要建立我的 AI Agent");
  });
});
