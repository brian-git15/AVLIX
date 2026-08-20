import { describe, expect, it } from "vitest";
import {
  bstInsert,
  buildBalancedBst,
  createNode,
  expectedInOrder,
  inOrderTraversal,
  isBalanced,
  type TreeNode,
} from "./tree";
import {
  bfsSolveExact,
  BFS_MAX_N,
  RUNTIME_EXACT_PAR_MAX_N,
  bfsMinRotations,
} from "./parBfs";
import { dswSolve } from "./solver";

function spine(n: number): TreeNode {
  let root: TreeNode | null = null;
  for (let v = 1; v <= n; v++) root = bstInsert(root, v);
  return root!;
}

function zigzag3(): TreeNode {
  const root = createNode(3);
  root.left = createNode(1);
  root.left.right = createNode(2);
  return root;
}

describe("bfsMinRotations (hand-verified small trees)", () => {
  it("right spine of 3 is one left rotation", () => {
    expect(bfsMinRotations(spine(3))).toBe(1);
  });

  it("left-right zigzag of 3 takes two singles (LR)", () => {
    expect(bfsMinRotations(zigzag3())).toBe(2);
  });

  it("already-balanced trees are 0", () => {
    expect(bfsMinRotations(buildBalancedBst(5))).toBe(0);
    expect(bfsMinRotations(buildBalancedBst(7))).toBe(0);
  });

  it("right spine of 5 balances in 2 left rotations (root 2, then 4)", () => {
    expect(bfsMinRotations(spine(5))).toBe(2);
  });

  it("right spine of 7 balances in 3 rotations", () => {
    expect(bfsMinRotations(spine(7))).toBe(3);
  });

  it("refuses n above the Catalan safety limit", () => {
    expect(() => bfsMinRotations(spine(BFS_MAX_N + 1))).toThrow(/refuses/);
  });

  it("returns an exact optimal path, not just the count", async () => {
    const { applyMove } = await import("./rotations");
    let live = zigzag3();
    const exact = bfsSolveExact(live);
    expect(exact.parRotations).toBe(2);
    expect(exact.path).toHaveLength(2);
    for (const move of exact.path) {
      live = applyMove(live, move);
    }
    expect(isBalanced(live)).toBe(true);
    expect(inOrderTraversal(live)).toEqual(expectedInOrder(3));
  });
});

describe("dswSolve par", () => {
  it("does not mutate the input tree", () => {
    const tree = spine(7);
    const before = inOrderTraversal(tree);
    const { moves, parRotations } = dswSolve(tree);
    expect(parRotations).toBe(moves.length);
    expect(inOrderTraversal(tree)).toEqual(before);
    expect(tree.value).toBe(1);
  });

  it("returns 0 moves when already balanced", () => {
    expect(dswSolve(buildBalancedBst(7))).toEqual({
      moves: [],
      parRotations: 0,
    });
  });

  it("runtime exact-par ceiling stays below the offline BFS cap", () => {
    expect(RUNTIME_EXACT_PAR_MAX_N).toBeLessThanOrEqual(BFS_MAX_N);
  });

  it("output is balanced and in-order-stable on random sizes", async () => {
    const { randomShapeScramble } = await import("./scramble");
    const { applyMove } = await import("./rotations");
    const { cloneTree } = await import("./tree");
    let seed = 21;
    const rng = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (const n of [7, 8, 15, 16, 31]) {
      for (let i = 0; i < 6; i++) {
        const scramble = randomShapeScramble(n, rng);
        const { moves, parRotations } = dswSolve(scramble);
        expect(parRotations).toBe(moves.length);
        let live = cloneTree(scramble)!;
        for (const move of moves) live = applyMove(live, move);
        expect(isBalanced(live)).toBe(true);
        expect(inOrderTraversal(live)).toEqual(expectedInOrder(n));
      }
    }
  });
});
