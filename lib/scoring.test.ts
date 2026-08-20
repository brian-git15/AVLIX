import { describe, expect, it } from "vitest";
import { buildBalancedBst, bstInsert, type TreeNode } from "./tree";
import {
  computeStars,
  parLabel,
  proceduralLevel,
  thresholdsFor,
  type RotationPar,
} from "./scoring";

const easyExact = thresholdsFor("easy", true);
const easyProc = thresholdsFor("easy", false);

describe("computeStars", () => {
  const par: RotationPar = { parRotations: 10, parExact: false };

  it("returns 3 at par and when beating par", () => {
    expect(computeStars(10, par, easyProc)).toBe(3);
    expect(computeStars(7, par, easyProc)).toBe(3);
  });

  it("returns 0 when far above threshold3", () => {
    expect(computeStars(100, par, easyProc)).toBe(0);
  });

  it("rounds exact threshold ratios in the player's favor", () => {
    const bands = { threshold2: 1.5, threshold3: 2.5 };
    expect(computeStars(15, par, bands)).toBe(2);
    expect(computeStars(25, par, bands)).toBe(1);
    expect(computeStars(26, par, bands)).toBe(0);
  });

  it("uses <= for the 3-star check, not ===", () => {
    expect(computeStars(0, { parRotations: 4, parExact: true }, easyExact)).toBe(
      3,
    );
  });
});

describe("par copy", () => {
  it("says optimal only when parExact", () => {
    expect(parLabel({ parRotations: 6, parExact: true })).toBe(
      "optimal: 6 moves",
    );
    expect(parLabel({ parRotations: 6, parExact: false })).toBe("par: 6 moves");
  });

  it("widens procedural thresholds", () => {
    expect(easyProc.threshold2).toBeGreaterThan(easyExact.threshold2);
    expect(easyProc.threshold3).toBeGreaterThan(easyExact.threshold3);
  });

  it("uses exact BFS par for small procedural levels", () => {
    let root: TreeNode | null = null;
    for (let v = 1; v <= 7; v++) root = bstInsert(root, v);
    const level = proceduralLevel(root!, "small");
    expect(level.parExact).toBe(true);
    expect(level.parRotations).toBe(3);
  });

  it("uses heuristic procedural par for larger levels", () => {
    const level = proceduralLevel(buildBalancedBst(15), "large");
    expect(level.parExact).toBe(false);
    expect(level.parRotations).toBe(0);
  });
});
