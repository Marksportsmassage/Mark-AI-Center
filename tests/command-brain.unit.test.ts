import { describe, expect, it } from "vitest";
import { buildCommandBrief } from "../src/lib/commandBrain";

describe("Command Brain", () => {
  it("command brief includes finance and non-finance items", () => {
    const brief = buildCommandBrief({
      userId: "owner",
      financeDecisions: [{ id: "f1", title: "課程", amount: 50000, status: "waiting_review", need_mark_review: true }] as never,
      clientProfiles: [{ id: "c1", display_name: "Client A", status: "draft", need_mark_review: true }] as never,
      contentDrafts: [{ id: "d1", title: "IG", status: "draft", need_mark_review: true }] as never
    });
    expect(brief.summary).toContain("finance");
    expect(brief.summary).toContain("client");
    expect(brief.main_focus.length).toBeGreaterThan(0);
  });

  it("command brief includes blocked items and no-cost actions", () => {
    const brief = buildCommandBrief({
      userId: "owner",
      investmentDecisions: [{ id: "i1", symbol: "MU", average_down_allowed: false, current_thesis_status: "unknown" }] as never,
      followups: [{ id: "fu1", title: "回收課程", status: "missed" }] as never
    });
    expect(brief.blocked_items.join(" ")).toContain("投資不可直接加碼");
    expect(brief.blocked_items.join(" ")).toContain("missed followup");
    expect(brief.no_cost_actions).toContain("清 Review Queue");
  });

  it("command brief creates only draft and no external action", () => {
    const brief = buildCommandBrief({ userId: "owner" });
    expect(brief.status).toBe("draft");
    expect(brief.need_mark_review).toBe(true);
    expect(brief.external_action_allowed).toBe(false);
    expect(brief.codex_job_candidates).toEqual([]);
  });

  it("empty context no crash", () => {
    const brief = buildCommandBrief({ userId: "owner" });
    expect(brief.main_focus.join(" ")).toContain("/intake");
  });
});
