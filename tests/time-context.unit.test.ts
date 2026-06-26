import { describe, expect, it } from "vitest";
import { buildAssistantAnswer } from "../src/lib/assistantExperience";
import { dataFreshness, isOverdue } from "../src/lib/staleness";
import { formatRelativeDeadline, getPartOfDay, getTimeContext, MARK_TIME_ZONE } from "../src/lib/timeContext";

describe("time-aware assistant context", () => {
  it("uses Asia/Taipei and identifies part of day", () => {
    const context = getTimeContext(new Date("2026-06-26T19:20:00+08:00"));
    expect(context.timeZone).toBe(MARK_TIME_ZONE);
    expect(context.dateKey).toBe("2026-06-26");
    expect(context.partOfDay).toBe("晚上");
    expect(getPartOfDay(3)).toBe("凌晨");
    expect(getPartOfDay(9)).toBe("早上");
    expect(getPartOfDay(15)).toBe("下午");
  });

  it("formats relative deadlines without confusing today and tomorrow", () => {
    const now = new Date("2026-06-27T03:20:00+08:00");
    expect(formatRelativeDeadline(new Date("2026-06-27T10:00:00+08:00"), now)).toBe("今天到期");
    expect(formatRelativeDeadline(new Date("2026-06-28T10:00:00+08:00"), now)).toBe("明天到期");
    expect(formatRelativeDeadline(new Date("2026-06-26T10:00:00+08:00"), now)).toContain("已逾期");
  });

  it("classifies data freshness and overdue state", () => {
    const now = new Date("2026-06-27T03:20:00+08:00");
    expect(dataFreshness(new Date("2026-06-27T01:20:00+08:00"), now).level).toBe("fresh");
    expect(dataFreshness(new Date("2026-06-25T01:20:00+08:00"), now).level).toBe("stale");
    expect(dataFreshness(new Date("2026-06-20T01:20:00+08:00"), now).level).toBe("outdated");
    expect(isOverdue(new Date("2026-06-26T23:59:00+08:00"), now)).toBe(true);
  });

  it("adds time context to assistant answers", () => {
    const answer = buildAssistantAnswer("我今天先做什麼？");
    expect(answer.sections.current_judgment).toContain(MARK_TIME_ZONE);
    expect(answer.sections.next_step).toContain("今天");
    expect(answer.safety_flags).toContain("time_context=Asia/Taipei");
  });
});
