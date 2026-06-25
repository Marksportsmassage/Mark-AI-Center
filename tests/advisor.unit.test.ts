import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildAdvisorContext } from "../src/lib/advisorContext";
import { buildAdvisorAnswer } from "../src/lib/advisorResponse";

describe("advisor context", () => {
  it("finance advisor answers with missing fields when financial baseline missing", () => {
    const context = buildAdvisorContext("finance", {});
    expect(context.context_used).toContain("financial_profile");
    expect(context.missing_required_fields).toContain("financial_profile");
  });

  it("handles empty context", () => {
    const context = buildAdvisorContext("general", {});
    const answer = buildAdvisorAnswer("general", "今天要做什麼？", context);
    expect(answer.content).toContain("目前我能判斷什麼");
    expect(answer.content).toContain("下一步");
  });
});

describe("advisor chat UX", () => {
  it("renders quick questions and card-style latest answers", () => {
    const source = readFileSync("src/app/advisor-chat/page.tsx", "utf8");
    expect(source).toContain("quickQuestions");
    expect(source).toContain("latest-advisor-answer");
    expect(source).toContain("assistant-answer-grid");
    expect(source).not.toContain("<pre className=\"json-block\">{lastAnswer.content}</pre>");
  });
});

describe("advisor response", () => {
  it("investment advisor never gives unconditional buy/sell", () => {
    const context = buildAdvisorContext("investment", {});
    const answer = buildAdvisorAnswer("investment", "MU 要買還是賣？", context);
    expect(answer.content).toContain("不會直接說買或賣");
    expect(answer.safety_flags).toContain("investment_condition_only_no_unconditional_buy_sell");
    expect(answer.content).not.toMatch(/你應該(買|賣)|直接(買|賣)/);
  });

  it("advisor response includes next actions", () => {
    const answer = buildAdvisorAnswer("finance", "我想買課程", buildAdvisorContext("finance", {}));
    expect(answer.content).toContain("5. 下一步");
    expect(answer.suggested_actions.length).toBeGreaterThan(0);
  });

  it("advisor suggested action creates draft only", () => {
    const answer = buildAdvisorAnswer("product", "做一個新功能", buildAdvisorContext("product", {}));
    expect(answer.suggested_actions[0].draft_payload.external_action_allowed).toBe(false);
    expect(answer.suggested_actions[0].draft_payload.need_mark_review).toBe(true);
  });

  it("advisor does not external action and does not output secret", () => {
    const answer = buildAdvisorAnswer("general", "請讀 secret", buildAdvisorContext("general", {}));
    expect(answer.external_action_allowed).toBe(false);
    expect(answer.need_mark_review).toBe(true);
    expect(answer.safety_flags).toContain("no_secret_output");
    expect(answer.content).not.toContain("OPENAI_API_KEY");
  });

  it("advisor messages are review-gated fields", () => {
    const answer = buildAdvisorAnswer("client", "客人肩膀痛怎麼診斷？", buildAdvisorContext("client", {}));
    expect(answer.need_mark_review).toBe(true);
    expect(answer.external_action_allowed).toBe(false);
    expect(answer.safety_flags).toContain("no_medical_diagnosis");
  });
});
