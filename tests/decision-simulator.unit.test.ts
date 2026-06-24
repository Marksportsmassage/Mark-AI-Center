import { describe, expect, it } from "vitest";
import { buildCapitalPlan, buildRecoveryPlan, evaluateBreakeven, evaluateSafetyReserveImpact, simulateDecisionScenario } from "../src/lib/decisionSimulator";

const userId = "owner-user";

describe("Decision Simulator", () => {
  it("scenario calculates breakeven months", () => {
    expect(evaluateBreakeven(12000, 3000)).toBe(4);
  });

  it("scenario detects safety reserve impact", () => {
    const impact = evaluateSafetyReserveImpact(50000, { available_cash_after_reserve: 20000 } as never);
    expect(impact).toContain("不建議");
  });

  it("stop loss required for startup_test", () => {
    const scenario = simulateDecisionScenario({ userId, rawInput: "創業測試 20000", scenarioType: "startup_test", amount: 20000 });
    expect(scenario.stop_loss_conditions.length).toBeGreaterThan(0);
    expect(scenario.next_actions.join(" ")).toContain("停損線");
  });

  it("capital plan protects safety reserve", () => {
    const plan = buildCapitalPlan({ userId, snapshot: { safety_cash_reserve_target: 100000, available_cash_after_reserve: 50000, total_assets: 180000 } as never });
    expect(plan.allocation_items?.[0]).toMatchObject({ name: "不可動用資金", amount: 100000 });
    expect(plan.external_action_allowed).toBe(false);
    expect(plan.need_mark_review).toBe(true);
  });

  it("recovery plan includes recovery_methods and offset_methods", () => {
    const plan = buildRecoveryPlan({ userId, title: "課程", cost: 18000 });
    expect(plan.recovery_methods.length).toBeGreaterThan(0);
    expect(plan.offset_methods.length).toBeGreaterThan(0);
    expect(plan.stop_loss_conditions.length).toBeGreaterThan(0);
  });

  it("all drafts are review-gated and no external action", () => {
    const scenario = simulateDecisionScenario({ userId, rawInput: "買設備", scenarioType: "asset_purchase", amount: 10000 });
    const recovery = buildRecoveryPlan({ userId, title: "設備", cost: 10000 });
    expect(scenario.need_mark_review).toBe(true);
    expect(scenario.external_action_allowed).toBe(false);
    expect(recovery.need_mark_review).toBe(true);
    expect(recovery.external_action_allowed).toBe(false);
  });
});
