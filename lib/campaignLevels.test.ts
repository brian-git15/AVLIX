import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_LEVELS,
  HARDCODED_CAMPAIGN_SPECS,
  getCampaignLevel,
} from "./campaignLevels";
import { expectedInOrder, inOrderTraversal, isBalanced } from "./tree";
import { applyMove } from "./rotations";
import { cloneTree } from "./tree";

describe("campaign levels", () => {
  it("ships a fixed folio of hardcoded levels", () => {
    expect(CAMPAIGN_LEVELS.length).toBe(HARDCODED_CAMPAIGN_SPECS.length);
    expect(CAMPAIGN_LEVELS.length).toBeGreaterThanOrEqual(13);
  });

  it("every level is unbalanced at start with exact optimal par", () => {
    for (const level of CAMPAIGN_LEVELS) {
      expect(isBalanced(level.scrambledTree)).toBe(false);
      expect(level.parExact).toBe(true);
      expect(level.optimalPath).toBeDefined();
      expect(level.optimalPath!.length).toBe(level.parRotations);
      expect(level.parRotations).toBeGreaterThan(0);
      expect(level.title).toBeTruthy();
    }
  });

  it("optimal paths balance every curated scramble", () => {
    for (const level of CAMPAIGN_LEVELS) {
      let live = cloneTree(level.scrambledTree)!;
      for (const move of level.optimalPath ?? []) {
        live = applyMove(live, move);
      }
      expect(isBalanced(live)).toBe(true);
      expect(inOrderTraversal(live)).toEqual(expectedInOrder(level.n));
    }
  });

  it("looks up levels by id", () => {
    expect(getCampaignLevel("c01")?.title).toBe("First Turn");
    expect(getCampaignLevel("missing")).toBeUndefined();
  });
});
