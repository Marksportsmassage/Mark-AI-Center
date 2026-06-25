import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assistantSuggestions, buildAssistantAnswer, buildAssistantReviewDashboard } from "../src/lib/assistantExperience";

describe("assistant home", () => {
  it("route exists", () => {
    expect(existsSync("src/app/assistant/page.tsx")).toBe(true);
  });

  it("handles empty context and includes next actions", () => {
    const answer = buildAssistantAnswer("我今天先做什麼？");
    expect(answer.sections.next_step).toBeTruthy();
    expect(answer.sections.links.length).toBeGreaterThan(0);
    expect(answer.safety_flags).toContain("external_action_allowed=false");
  });

  it("investment question never returns unconditional buy or sell", () => {
    const answer = buildAssistantAnswer("股票可以加碼嗎？");
    const text = Object.values(answer.sections).join(" ");
    expect(text).toContain("條件式");
    expect(text).not.toMatch(/直接買|直接賣|無條件買|無條件賣/);
    expect(answer.safety_flags).toContain("no_unconditional_buy_sell");
  });

  it("has useful suggestion cards", () => {
    expect(assistantSuggestions.length).toBeGreaterThanOrEqual(3);
    expect(assistantSuggestions.some((item) => item.href === "/exam-review")).toBe(true);
  });

  it("exam questions return auto content summaries", () => {
    const answer = buildAssistantAnswer("我要準備期末考，TENS 怎麼讀？");
    expect(answer.content_summary?.title).toBeTruthy();
    expect(answer.content_summary?.recommended_start).toContain("先看");
    expect(answer.content_summary?.topics.some((topic) => topic.id === "physical-modality")).toBe(true);
    expect(answer.content_summary?.ready.length).toBeGreaterThan(0);
    expect(answer.safety_flags).toContain("no_fabricated_questions");
  });

  it("builds a Mark-facing review dashboard", () => {
    const dashboard = buildAssistantReviewDashboard();
    expect(dashboard.completed.some((item) => item.href === "/assistant-universe")).toBe(true);
    expect(dashboard.needsMarkReview.some((item) => item.title.includes("HIFEM"))).toBe(true);
    expect(dashboard.suggestedQuestions).toContain("我要準備期末考");
  });

  it("answers assistant system progress questions with a review dashboard", () => {
    const answer = buildAssistantAnswer("助理系統還缺什麼？");
    expect(answer.review_dashboard?.completed.length).toBeGreaterThan(0);
    expect(answer.review_dashboard?.needsMarkReview.length).toBeGreaterThan(0);
    expect(answer.sections.links.some((link) => link.href === "/assistant-universe")).toBe(true);
  });

  it("uses a modern visual command surface instead of plain table UI", () => {
    const source = readFileSync("src/app/assistant/page.tsx", "utf8");
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(source).toContain("lucide-react");
    expect(source).toContain("進入公司宇宙");
    expect(source).toContain("用問答補資料");
    expect(css).toContain("assistant-command-surface");
    expect(css).toContain("hero-action-row");
    expect(css).toContain("command-panel");
  });
});
