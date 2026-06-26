import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildAssistantAnswer, inferAssistantMode } from "../src/lib/assistantExperience";
import { assistantAssignments, assistantReportPlans, conversationalIntakeFlows, matchConversationalIntakeFlow } from "../src/lib/assistantOps";

describe("assistant operations", () => {
  it("routes flexible natural language to operations mode", () => {
    expect(inferAssistantMode("公司助理今天要怎麼定時匯報，哪些員工在處理？")).toBe("operations");
    const answer = buildAssistantAnswer("有哪些員工在處理，今天要怎麼匯報？");
    expect(answer.ops_dashboard?.assignments.length).toBeGreaterThan(0);
    expect(answer.sections.next_step).toContain("公司營運");
  });

  it("keeps every assignment review gated and external-action disabled", () => {
    expect(assistantAssignments.length).toBeGreaterThanOrEqual(5);
    for (const assignment of assistantAssignments) {
      expect(assignment.need_mark_review).toBe(true);
      expect(assignment.external_action_allowed).toBe(false);
      expect(assignment.owner_label).toContain("助理");
    }
  });

  it("reports stay inside the website unless Mark approves external notifications", () => {
    expect(assistantReportPlans.some((report) => report.title.includes("每日公司總匯報"))).toBe(true);
    expect(assistantReportPlans.every((report) => report.external_action_allowed === false)).toBe(true);
    expect(assistantReportPlans.map((report) => report.delivery).join(" ")).toContain("LINE 推播需 Mark 另外批准");
  });

  it("matches conversational intake flows without fixed wording", () => {
    expect(matchConversationalIntakeFlow("剛剛刷卡買了一個東西，幫我判斷").id).toBe("spending");
    expect(matchConversationalIntakeFlow("NVDA 現在是不是能加碼").id).toBe("investment");
    expect(matchConversationalIntakeFlow("我要讀 TENS 跟震波").id).toBe("exam");
    expect(conversationalIntakeFlows.every((flow) => flow.questions.length >= 4)).toBe(true);
  });

  it("assistant and intake pages expose operations UI", () => {
    const assistantSource = readFileSync("src/app/assistant/page.tsx", "utf8");
    const intakeSource = readFileSync("src/app/intake/page.tsx", "utf8");
    expect(assistantSource).toContain("需要你審核");
    expect(assistantSource).toContain("opsDashboard.review_actions");
    expect(assistantSource).toContain("opsDashboard.answer_requests");
    expect(intakeSource).toContain("問答式資料輸入");
    expect(intakeSource).toContain("matchConversationalIntakeFlow");
  });
});
