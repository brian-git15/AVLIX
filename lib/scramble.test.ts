import { describe, expect, it } from "vitest";
import { expectedInOrder, inOrderTraversal, isBalanced, treeSize } from "./tree";
import {
  generateScramble,
  randomShapeScramble,
  randomWalkScramble,
} from "./scramble";

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("scramble", () => {
  it("random-shape trees are valid BSTs of 1..n", () => {
    const rng = mulberry32(7);
    for (const n of [7, 15]) {
      const tree = randomShapeScramble(n, rng);
      expect(treeSize(tree)).toBe(n);
      expect(inOrderTraversal(tree)).toEqual(expectedInOrder(n));
    }
  });

  it("random-shape is usually unbalanced for n >= 7", () => {
    const rng = mulberry32(99);
    let unbalanced = 0;
    for (let i = 0; i < 12; i++) {
      if (!isBalanced(randomShapeScramble(15, rng))) unbalanced += 1;
    }
    expect(unbalanced).toBeGreaterThan(8);
  });

  it("random-walk starts from 1..n and stays a BST", () => {
    const rng = mulberry32(3);
    const tree = randomWalkScramble(15, 20, rng);
    expect(inOrderTraversal(tree)).toEqual(expectedInOrder(15));
  });

  it("generateScramble respects mode", () => {
    const a = generateScramble({ n: 7, mode: "random-shape", rng: mulberry32(1) });
    const b = generateScramble({
      n: 7,
      mode: "random-walk",
      k: 12,
      rng: mulberry32(1),
    });
    expect(inOrderTraversal(a)).toEqual(expectedInOrder(7));
    expect(inOrderTraversal(b)).toEqual(expectedInOrder(7));
  });
});
