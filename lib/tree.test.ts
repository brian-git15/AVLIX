import { describe, expect, it } from "vitest";
import {
  balanceFactors,
  bstInsert,
  buildBalancedBst,
  createNode,
  expectedInOrder,
  height,
  inOrderTraversal,
  isBalanced,
  treeSize,
  type TreeNode,
} from "./tree";

function chainRight(n: number): TreeNode {
  let root: TreeNode | null = null;
  for (let v = 1; v <= n; v++) root = bstInsert(root, v);
  return root!;
}

describe("tree core", () => {
  it("inserts as a BST and in-order is 1..n", () => {
    let root: TreeNode | null = null;
    for (const v of [4, 2, 6, 1, 3, 5, 7]) root = bstInsert(root, v);
    expect(inOrderTraversal(root)).toEqual(expectedInOrder(7));
    expect(treeSize(root)).toBe(7);
  });

  it("gives empty height -1 and leaf height 0", () => {
    expect(height(null)).toBe(-1);
    expect(height(createNode(1))).toBe(0);
  });

  it("treats a complete tree of 7 as AVL-balanced", () => {
    const root = buildBalancedBst(7);
    expect(isBalanced(root)).toBe(true);
    expect(inOrderTraversal(root)).toEqual(expectedInOrder(7));
  });

  it("rejects a right spine of 3 (strict per-node AVL)", () => {
    const root = chainRight(3);
    expect(isBalanced(root)).toBe(false);
    expect(Math.abs(balanceFactors(root).get(root.id)!)).toBeGreaterThan(1);
  });

  it("rejects a left-right zigzag of 3 (local |bf| of 2 at the root)", () => {
    const root = createNode(3);
    root.left = createNode(1);
    root.left.right = createNode(2);
    expect(isBalanced(root)).toBe(false);
    expect(Math.abs(balanceFactors(root).get("n-3")!)).toBe(2);
  });

  it("stable ids follow values", () => {
    const n = createNode(9);
    expect(n.id).toBe("n-9");
  });
});
