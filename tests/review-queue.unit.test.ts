import { describe, expect, it } from "vitest";
import { buildReviewQueue } from "../src/lib/reviewQueue";

describe("Review Queue", () => {
  it("review queue aggregates waiting review items", () => {
    const queue = buildReviewQueue({
      finance_decisions: [{ id: "f1", title: "Line Pay", status: "waiting_mark_input", need_mark_review: true, missing_required_fields: ["金額"], created_at: "2026-06-24" }],
      investment_decisions: [{ id: "i1", symbol: "2330", status: "waiting_mark_input", need_mark_review: true, missing_required_fields: ["目前價格"], created_at: "2026-06-23" }],
      task_dispatches: [{ id: "t1", title: "Task", status: "done", need_mark_review: false }]
    });
    expect(queue).toHaveLength(2);
    expect(queue.map((item) => item.group)).toContain("財務決策待審核");
    expect(queue.map((item) => item.group)).toContain("投資決策待審核");
  });

  it("review queue handles empty collections", () => {
    expect(buildReviewQueue({ finance_decisions: [], task_dispatches: [] })).toEqual([]);
  });

  it("review queue exposes next actions, missing review hint, and filters high risk", () => {
    const queue = buildReviewQueue({
      finance_decisions: [
        { id: "f1", title: "High risk", status: "waiting_review", need_mark_review: true, risk_level: "high", missing_required_fields: [], created_at: "2026-06-24" },
        { id: "f2", title: "Low risk", status: "waiting_review", need_mark_review: true, risk_level: "watch", missing_required_fields: ["金額"], created_at: "2026-06-23" }
      ]
    }, { filter: "high_risk", sort: "risk" });
    expect(queue).toHaveLength(1);
    expect(queue[0].needs_review_draft).toBe(true);
    expect(queue[0].recommendation).toContain("尚未產生分析");
  });

  it("review queue can sort missing info first", () => {
    const queue = buildReviewQueue({
      finance_decisions: [
        { id: "f1", title: "Complete", status: "waiting_review", need_mark_review: true, missing_required_fields: [], created_at: "2026-06-24" },
        { id: "f2", title: "Missing", status: "waiting_mark_input", need_mark_review: true, missing_required_fields: ["金額", "用途"], created_at: "2026-06-23" }
      ]
    }, { sort: "missing" });
    expect(queue[0].title).toBe("Missing");
  });
});
