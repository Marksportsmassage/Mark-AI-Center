import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assistantBranches } from "../src/lib/assistantExperience";

describe("assistant universe visual", () => {
  it("uses a real 3D universe scene with orbs and effects", () => {
    const source = readFileSync("src/components/AssistantUniverseScene.tsx", "utf8");
    expect(source).toContain("new THREE.WebGLRenderer");
    expect(source).toContain("SphereGeometry");
    expect(source).toContain("RingGeometry");
    expect(source).toContain("galaxyField");
    expect(source).toContain("activeBeam");
    expect(source).toContain("pointerdown");
  });

  it("contains the income growth assistant node", () => {
    expect(assistantBranches.map((branch) => branch.title)).toContain("收入成長助理");
    expect(assistantBranches.find((branch) => branch.id === "income")?.href).toBe("/income-lab");
  });
});
