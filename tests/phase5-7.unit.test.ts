import { describe, expect, it } from "vitest";
import { mockRouteIntentStructured } from "../src/lib/ai/routeIntentSchema";
import { buildCodexJobDraft } from "../src/lib/codexJobs";
import { buildCapitalAllocationTestTask, sampleTask } from "./test-fixtures";
import { buildFinanceReviewDraft, FINANCE_RISK_REMINDERS, missingFinancialProfileFields } from "../src/lib/finance";
import { buildDailyBriefDraft } from "../src/lib/reports/dailyBrief";
import { buildDecisionReportDraft } from "../src/lib/reports/decisionReport";
import { knowledgeSopSeedTemplates } from "../src/lib/knowledgeSeeds";
import { buildUniverseSummary } from "../src/lib/universe";
import { safeJson } from "../src/lib/ui/format";

describe("Finance / Capital Phase 5", () => {
  it("Finance profile reports missing Mark fields without guessing amounts", () => {
    expect(missingFinancialProfileFields(null)).toContain("目前可動用現金");
  });

  it("Finance Review draft from apparel task is review gated", () => {
    const review = buildFinanceReviewDraft(sampleTask({ project_id: "apparel_business" }));
    expect(review.recommendation).toBe("small_test");
    expect(review.need_mark_review).toBe(true);
    expect(review.external_action_allowed).toBe(false);
    expect(review.missing_required_fields).toContain("目前可動用現金");
  });

  it("Capital finance reminders are fixed guardrails", () => {
    expect(FINANCE_RISK_REMINDERS).toContain("不得動用安全現金水位");
    expect(FINANCE_RISK_REMINDERS).toContain("每個副業都必須有停損線");
  });
});

describe("Decision Report Phase 5B", () => {
  it("Decision report generator creates apparel cost/risk draft with finance link placeholder", () => {
    const report = buildDecisionReportDraft(sampleTask({ project_id: "apparel_business" }));
    expect(report.status).toBe("draft");
    expect(report.need_mark_review).toBe(true);
    expect(report.linked_finance_review_id).toBeNull();
    expect(report.cost_items.map((item) => item.name)).toContain("進貨成本");
    expect(report.risk_items.map((item) => item.risk)).toContain("庫存滯銷");
  });
});

describe("Daily Brief Phase 5C", () => {
  it("Daily Brief includes finance reminders and SOP suggestions", () => {
    const brief = buildDailyBriefDraft({
      userId: "owner",
      dateKey: "2026-06-24",
      inbox: [{ id: "i1", source: "line", title: "line", body: "服飾", raw_text: "服飾", priority: "medium", status: "new", need_mark_review: true, review_status: "pending", created_at: "", updated_at: "" }],
      tasks: [buildCapitalAllocationTestTask()],
      financeReviews: [buildFinanceReviewDraft(sampleTask({ project_id: "apparel_business" })) as never],
      financialProfile: null
    });
    expect(brief.finance_reminders).toContain("不得動用安全現金水位");
    expect(brief.recommended_sop_updates?.[0]).toContain("整理 SOP");
  });
});

describe("Knowledge SOP Phase 7", () => {
  it("Knowledge SOP seeds include required draft templates", () => {
    expect(knowledgeSopSeedTemplates).toHaveLength(11);
    expect(knowledgeSopSeedTemplates.every((sop) => sop.status === "draft" && sop.need_mark_review)).toBe(true);
  });
});

describe("Universe Phase 7.5", () => {
  it("Universe summary includes Finance Advisor node counts", () => {
    const summary = buildUniverseSummary({
      projects: [{ id: "p", name: "P", description: "", category: "startup", default_agent_ids: [], status: "active", owner_user_id: "owner", priority: "medium", tags: [], next_action: "", need_mark_review: true, review_status: "pending", created_at: "", updated_at: "" }],
      agents: [],
      tasks: [sampleTask({ status: "waiting_review" })],
      reports: [buildDecisionReportDraft(sampleTask({ project_id: "apparel_business" })) as never],
      financeReviews: [buildFinanceReviewDraft(sampleTask({ project_id: "beverage_business" })) as never],
      jobs: [buildCodexJobDraft(sampleTask({})) as never],
      sops: []
    });
    expect(summary.totalActiveProjects).toBe(1);
    expect(summary.financeAdvisor.financeReviewCount).toBe(1);
    expect(summary.codexJobDrafts).toBe(1);
  });
});

describe("Codex Jobs Phase 5E", () => {
  it("Codex job draft is review gated and forbids external actions", () => {
    const job = buildCodexJobDraft(sampleTask({ codex_needed: true }));
    expect(job.status).toBe("draft");
    expect(job.needs_mark_review).toBe(true);
    expect(job.external_action_allowed).toBe(false);
    expect(job.forbidden_actions).toContain("no secrets");
  });
});

describe("Audit Log Viewer Phase 5D", () => {
  it("Audit redaction hides sensitive keys", () => {
    const json = safeJson({ token: "abc", OPENAI_API_KEY: "sk-test", nested: { authorization: "Bearer token" } });
    expect(json).toContain("redacted");
    expect(json).not.toContain("sk-test");
    expect(json).not.toContain("Bearer token");
  });
});

describe("Route Intent matrix support", () => {
  it("Route mock startup input creates review-gated task", () => {
    const result = mockRouteIntentStructured("請幫我評估服飾選品，初期測試資金要抓多少");
    expect(result.task_dispatch.needed).toBe(true);
    expect(result.classification.need_mark_review).toBe(true);
    expect(result.safety.external_action_allowed).toBe(false);
    expect(result.classification.project_id).toBe("apparel_business");
  });
});
