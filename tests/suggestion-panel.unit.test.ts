import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assistantSuggestions } from "../src/lib/assistantExperience";

describe("AssistantSuggestionPanel", () => {
  it("contains risk and next action UI hooks", () => {
    const suggestion = assistantSuggestions[0];
    const source = readFileSync("src/components/AssistantSuggestionPanel.tsx", "utf8");
    expect(source).toContain("為什麼重要");
    expect(source).toContain("下一步");
    expect(source).toContain("risk-");
    expect(suggestion.risk).toBeTruthy();
    expect(suggestion.next_action).toBeTruthy();
  });
});
