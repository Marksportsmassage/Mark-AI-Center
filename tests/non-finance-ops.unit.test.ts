import { describe, expect, it } from "vitest";
import {
  buildBusinessExperiment,
  buildClientProfileDraft,
  buildClientSessionDraft,
  buildContentDraft,
  buildContentIdea,
  buildProductFeature,
  buildRoadmapItem,
  buildStartupTestPlan,
  buildStudyNote
} from "../src/lib/nonFinanceOps";

const userId = "owner";

describe("client ops", () => {
  it("create client profile draft", () => {
    const draft = buildClientProfileDraft(userId, { displayName: "Client A", goals: "ROM", risks: "疼痛注意" });
    expect(draft.display_name).toBe("Client A");
    expect(draft.need_mark_review).toBe(true);
    expect(draft.external_action_allowed).toBe(false);
  });

  it("create client session draft and no medical diagnosis", () => {
    const draft = buildClientSessionDraft(userId, { notes: "肩膀痛", exercises: "ROM", caution: "避免疼痛加劇" });
    expect(draft.caution_notes).toContain("非醫療診斷");
    expect(draft.external_action_allowed).toBe(false);
  });
});

describe("content studio", () => {
  it("create content draft no auto post", () => {
    const draft = buildContentDraft(userId, { title: "肩關節 ROM", topic: "rom", material: "素材" });
    expect(draft.no_auto_post).toBe(true);
    expect(draft.need_mark_review).toBe(true);
    expect(draft.external_action_allowed).toBe(false);
  });

  it("create content idea and study note", () => {
    expect(buildContentIdea(userId, { title: "MMT" }).outline.length).toBeGreaterThan(0);
    expect(buildStudyNote(userId, { title: "物理因子", topic: "physical_modality" }).missing_required_fields).toContain("source_material");
  });
});

describe("business lab", () => {
  it("create business experiment with stop loss", () => {
    const draft = buildBusinessExperiment(userId, { title: "飲料店測試", budget: 3000, stopLoss: "無預購即停止" });
    expect(draft.stop_loss).toContain("停止");
    expect(draft.external_action_allowed).toBe(false);
  });

  it("create startup test plan without supplier contact or payment", () => {
    const draft = buildStartupTestPlan(userId, { title: "服飾選品" });
    expect(draft.no_supplier_contact).toBe(true);
    expect(draft.no_payment).toBe(true);
    expect(draft.need_mark_review).toBe(true);
  });
});

describe("product roadmap", () => {
  it("create product feature draft", () => {
    const draft = buildProductFeature(userId, { title: "Advisor Chat", value: "更好討論策略" });
    expect(draft.title).toBe("Advisor Chat");
    expect(draft.external_action_allowed).toBe(false);
  });

  it("create roadmap item draft", () => {
    const draft = buildRoadmapItem(userId, { title: "Phase 17", area: "ops" });
    expect(draft.need_mark_review).toBe(true);
    expect(draft.external_action_allowed).toBe(false);
  });
});
