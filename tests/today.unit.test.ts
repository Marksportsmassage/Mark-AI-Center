import { describe, expect, it } from "vitest";
import { buildTodayDashboardSummary, todayErrorMessage } from "../src/lib/today";

describe("Today Operating Dashboard helper", () => {
  it("handles empty data", () => {
    const summary = buildTodayDashboardSummary({});
    expect(summary.total_waiting_review).toBe(0);
    expect(summary.top_three).toEqual([]);
    expect(summary.no_cost_next_actions).toContain("補財務資料");
    expect(summary.finance_radar.safety_cash_missing).toBe(true);
  });

  it("handles missing indexes or read errors gracefully", () => {
    const message = todayErrorMessage([null, "Firestore 讀取失敗，請確認 owner 權限與 rules。"]);
    expect(message).toContain("Firestore 讀取失敗");
    expect(message).toContain("index");
  });

  it("prioritizes high risk and missing info review queue items", () => {
    const summary = buildTodayDashboardSummary({
      reviewQueueItems: [
        { id: "low", title: "Low", collection: "task_dispatches", group: "任務派工待審核", status: "waiting_review", risk_level: "watch", risk_priority: 1, recommendation: "review", next_actions: [], needs_review_draft: false, created_at: "", missing_required_fields: [], href: "/task-dispatches/low" },
        { id: "high", title: "High", collection: "finance_decisions", group: "財務決策待審核", status: "waiting_review", risk_level: "critical", risk_priority: 4, recommendation: "delay", next_actions: [], needs_review_draft: false, created_at: "", missing_required_fields: ["金額"], href: "/finance-decisions/high" }
      ]
    });
    expect(summary.top_three[0]).toContain("High");
    expect(summary.high_risk_count).toBeGreaterThan(0);
    expect(summary.missing_info_count).toBeGreaterThan(0);
  });

  it("does not recommend average down when thesis unknown or invalid", () => {
    const summary = buildTodayDashboardSummary({
      investmentDecisions: [{
        id: "i1",
        user_id: "owner",
        asset_type: "stock",
        symbol: "MU",
        market: "US",
        position_type: "add",
        cost_basis: null,
        current_price: null,
        quantity: null,
        market_value: null,
        unrealized_pnl: null,
        original_thesis: null,
        current_thesis_status: "unknown",
        time_horizon: "medium",
        buy_conditions: [],
        add_conditions: [],
        reduce_conditions: [],
        take_profit_conditions: [],
        stop_loss_conditions: [],
        average_down_allowed: false,
        average_down_conditions: [],
        max_position_limit: null,
        cashflow_impact: "",
        missing_required_fields: ["目前價格"],
        need_mark_review: true,
        external_action_allowed: false,
        status: "waiting_mark_input",
        created_at: "",
        updated_at: ""
      }]
    });
    expect(summary.investment_reminders.join(" ")).toContain("average_down_allowed=false");
    expect(summary.do_not_do_today.join(" ")).toContain("不建議攤平");
  });
});
