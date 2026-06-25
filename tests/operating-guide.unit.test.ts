import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RELEASE_NOTES, SAFETY_NOTES, publicEnvPresence, safetyChecklist } from "../src/lib/governance";

describe("start here", () => {
  it("start here route content is covered by smoke routes", () => {
    const smoke = readFileSync("tests/route-smoke.ts", "utf8");
    const startHere = readFileSync("src/app/start-here/page.tsx", "utf8");
    expect(smoke).toContain("/start-here");
    expect(smoke).toContain("/advisor-chat");
    expect(smoke).toContain("/command-brain");
    expect(startHere).toContain("我要準備期末考");
  });
});

describe("safety center", () => {
  it("safety center lists disabled external actions", () => {
    const safety = safetyChecklist();
    expect(safety.line_reply_push_enabled).toBe(false);
    expect(safety.functions_deployed).toBe(false);
    expect(safety.external_action_allowed).toBe(false);
    expect(SAFETY_NOTES.join(" ")).toContain("不自動交易");
    expect(SAFETY_NOTES.join(" ")).toContain("內容草稿不自動發布");
  });
});

describe("operating guide", () => {
  it("release notes include Phase 13-16", () => {
    const notes = RELEASE_NOTES.join(" ");
    expect(notes).toContain("Phase 13");
    expect(notes).toContain("Phase 14");
    expect(notes).toContain("Phase 15");
    expect(notes).toContain("Phase 16");
  });

  it("does not output secret values", () => {
    const result = publicEnvPresence({ NEXT_PUBLIC_FIREBASE_API_KEY: "value-that-must-not-appear" });
    expect(JSON.stringify(result)).not.toContain("value-that-must-not-appear");
  });

  it("docs include Phase 17 backlog and final guide", () => {
    expect(readFileSync("docs/final-operating-guide.md", "utf8")).toContain("每天流程");
    expect(readFileSync("docs/backlog-phase-17.md", "utf8")).toContain("LINE advisor integration");
  });
});
