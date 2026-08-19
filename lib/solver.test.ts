import { describe, expect, it } from "vitest";
import {
  bstInsert,
  cloneTree,
  expectedInOrder,
  inOrderTraversal,
  isBalanced,
  type TreeNode,
} from "./tree";
import { applyMove } from "./rotations";
import { dswBalance } from "./solver";
import { randomShapeScramble } from "./scramble";

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spine(n: number): TreeNode {
  let root: TreeNode | null = null;
  for (let v = 1; v <= n; v++) root = bstInsert(root, v);
  return root!;
}

describe("DSW solver", () => {
  it("balances a right spine and preserves in-order", () => {
    const { tree, moves } = dswBalance(spine(15));
    expect(isBalanced(tree)).toBe(true);
    expect(inOrderTraversal(tree)).toEqual(expectedInOrder(15));
    expect(moves.length).toBeGreaterThan(0);
  });

  it("balances random scrambles of several sizes", () => {
    const rng = mulberry32(21);
    for (const n of [7, 8, 15, 16, 31]) {
      for (let i = 0; i < 8; i++) {
        const scramble = randomShapeScramble(n, rng);
        const copy = cloneTree(scramble)!;
        const { tree, moves } = dswBalance(copy);
        expect(isBalanced(tree)).toBe(true);
        expect(inOrderTraversal(tree)).toEqual(expectedInOrder(n));

        let live = scramble;
        for (const move of moves) {
          live = applyMove(live, move);
        }
        expect(isBalanced(live)).toBe(true);
        expect(inOrderTraversal(live)).toEqual(expectedInOrder(n));
      }
    }
  });
});
