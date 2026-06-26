import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assistantBranches, assistantBranchCompletion } from "../src/lib/assistantExperience";

describe("assistant universe", () => {
  it("route exists and nodes exist", () => {
    expect(existsSync("src/app/assistant-universe/page.tsx")).toBe(true);
    expect(assistantBranches.map((item) => item.title)).toContain("財務長助理");
    expect(assistantBranches.map((item) => item.title)).toContain("學習內容助理");
  });

  it("node helper returns drawer model", () => {
    const cfo = assistantBranches.find((item) => item.id === "cfo");
    expect(cfo?.purpose).toContain("現金流");
    expect(cfo?.title).toContain("財務長");
    expect(cfo?.nodes.some((node) => node.label === "財務基準")).toBe(true);
    expect(cfo?.completed.length).toBeGreaterThan(0);
    expect(cfo?.review_items.length).toBeGreaterThan(0);
    expect(cfo?.memory_items.length).toBeGreaterThan(0);
    expect(cfo?.reminder_rules.length).toBeGreaterThan(0);
    expect(cfo?.ask_examples.some((item) => item.includes("花錢"))).toBe(true);
    expect(cfo ? assistantBranchCompletion(cfo) : 0).toBeGreaterThan(0);
  });

  it("universe page exposes completed and review sections", () => {
    const source = readFileSync("src/app/assistant-universe/page.tsx", "utf8");
    expect(source).toContain("已完成");
    expect(source).toContain("需要 Mark 確認");
    expect(source).toContain("prompt=");
    expect(source).toContain("assistant-progress");
    expect(source).toContain("AssistantUniverseScene");
  });

  it("uses a Three.js 3D universe scene", () => {
    const source = readFileSync("src/components/AssistantUniverseScene.tsx", "utf8");
    expect(source).toContain("await import(\"three\")");
    expect(source).toContain("new THREE.WebGLRenderer");
    expect(source).toContain("SphereGeometry");
    expect(source).toContain("RingGeometry");
    expect(source).toContain("ACESFilmicToneMapping");
    expect(source).toContain("FogExp2");
    expect(source).toContain("CanvasTexture");
    expect(source).toContain("galaxyField");
    expect(source).toContain("activeBeam");
    expect(source).toContain("pointerdown");
  });

  it("universe page has a visual stage instead of a plain card list", () => {
    const page = readFileSync("src/app/assistant-universe/page.tsx", "utf8");
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(page).toContain("3D 公司行星圖");
    expect(page).toContain("universe-stage");
    expect(page).toContain("universe-page");
    expect(css).toContain("universe-stage-header");
    expect(css).toContain("assistant-universe-scene::after");
  });
});
