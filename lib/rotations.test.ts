import { describe, expect, it } from "vitest";
import {
  bstInsert,
  cloneTree,
  collectNodes,
  expectedInOrder,
  inOrderTraversal,
  structureOf,
  type TreeNode,
} from "./tree";
import {
  applyMove,
  rotateLeft,
  rotateLeftRight,
  rotateRight,
  rotateRightLeft,
} from "./rotations";

function fromInserts(values: number[]): TreeNode {
  let root: TreeNode | null = null;
  for (const v of values) root = bstInsert(root, v);
  return root!;
}

function randomTree(n: number, rng: () => number): TreeNode {
  const values = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = values[i]!;
    values[i] = values[j]!;
    values[j] = tmp;
  }
  return fromInserts(values);
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("rotations", () => {
  it("rotateLeft then rotateRight restores structure", () => {
    const root = fromInserts([2, 1, 4, 3, 5]);
    const before = structureOf(root);
    const lifted = rotateLeft(root);
    expect(lifted.value).toBe(4);
    const restored = rotateRight(lifted);
    expect(structureOf(restored)).toEqual(before);
  });

  it("rotateRight then rotateLeft restores structure", () => {
    const root = fromInserts([4, 2, 5, 1, 3]);
    const before = structureOf(root);
    const lifted = rotateRight(root);
    const restored = rotateLeft(lifted);
    expect(structureOf(restored)).toEqual(before);
  });

  it("preserves in-order on LR and RL helpers", () => {
    const lr = fromInserts([3, 1, 2]);
    const afterLr = rotateLeftRight(lr);
    expect(inOrderTraversal(afterLr)).toEqual([1, 2, 3]);

    const rl = fromInserts([1, 3, 2]);
    const afterRl = rotateRightLeft(rl);
    expect(inOrderTraversal(afterRl)).toEqual([1, 2, 3]);
  });

  it("never changes in-order under random rotation sequences", () => {
    const rng = mulberry32(42);
    for (const n of [5, 6, 7, 8, 9, 10]) {
      for (let trial = 0; trial < 20; trial++) {
        let root = randomTree(n, rng);
        const expected = expectedInOrder(n);
        expect(inOrderTraversal(root)).toEqual(expected);
        for (let step = 0; step < 25; step++) {
          const nodes = collectNodes(root);
          const rotatable = nodes.filter((node) => node.left || node.right);
          const node = rotatable[Math.floor(rng() * rotatable.length)]!;
          const type = node.right && (rng() < 0.5 || !node.left) ? "L" : "R";
          if (type === "L" && !node.right) continue;
          if (type === "R" && !node.left) continue;
          root = applyMove(root, { type, nodeId: node.id });
          expect(inOrderTraversal(root)).toEqual(expected);
        }
      }
    }
  });

  it("does not clone nodes — ids stay the same objects", () => {
    const root = fromInserts([1, 2, 3]);
    const two = root.right!;
    const three = two.right!;
    const newRoot = rotateLeft(root);
    expect(newRoot).toBe(two);
    expect(newRoot.left).toBe(root);
    expect(newRoot.right).toBe(three);
  });

  it("cloneTree is a deep copy with the same ids", () => {
    const root = fromInserts([2, 1, 3]);
    const copy = cloneTree(root)!;
    expect(structureOf(copy)).toEqual(structureOf(root));
    expect(copy).not.toBe(root);
    expect(copy.left).not.toBe(root.left);
  });
});
