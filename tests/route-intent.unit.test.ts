import { describe, expect, it } from "vitest";
import { resolveRouteIntentMode } from "../src/lib/ai/routeIntentMode";
import { allowedAgentIds, allowedProjectIds, mockRouteIntentStructured, routeIntentResultSchema } from "../src/lib/ai/routeIntentSchema";

const input = { raw_text: "請幫我評估服飾選品，初期測試資金要抓多少", source: "web" as const };

describe("Route Intent Test Matrix", () => {
  it("mock mode business/startup input creates task", async () => {
    const result = await resolveRouteIntentMode(input, "mock", async () => ({ ok: false, error: "unused" }));
    expect(result.ok).toBe(true);
    expect(result.result?.task_dispatch.needed).toBe(true);
  });

  it("unclear input needs_clarification=true", () => {
    const result = mockRouteIntentStructured("這個之後可以做");
    expect(result.classification.needs_clarification).toBe(true);
  });

  it("openai missing key does not crash", async () => {
    const result = await resolveRouteIntentMode(input, "openai", async () => ({ ok: false, error: "missing OPENAI_API_KEY" }));
    expect(result.ok).toBe(false);
    expect(result.error).toContain("missing");
  });

  it("fallback simulated failure uses mock", async () => {
    const result = await resolveRouteIntentMode(input, "fallback", async () => ({ ok: false, error: "network" }));
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("fallback");
    expect(result.result?.task_dispatch.needed).toBe(true);
  });

  it("schema validation fail does not return task result", async () => {
    const result = await resolveRouteIntentMode(input, "openai", async () => ({ ok: true, result: { bad: true } }));
    expect(result.ok).toBe(false);
    expect(result.validationFailed).toBe(true);
    expect(result.result).toBeNull();
  });

  it("project_id and agent_ids are restricted", () => {
    const result = routeIntentResultSchema.safeParse({
      ...mockRouteIntentStructured(input.raw_text),
      classification: { ...mockRouteIntentStructured(input.raw_text).classification, project_id: "bad_project", agent_ids: ["bad_agent"] }
    });
    expect(result.success).toBe(false);
    expect(allowedProjectIds).toContain("apparel_business");
    expect(allowedAgentIds).toContain("cfo_ai");
  });

  it("need_mark_review=true and external_action_allowed=false", () => {
    const result = mockRouteIntentStructured(input.raw_text);
    expect(result.classification.need_mark_review).toBe(true);
    expect(result.safety.external_action_allowed).toBe(false);
  });
});
