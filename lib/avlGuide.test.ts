import { describe, expect, it } from "vitest";
import { bstInsert, type TreeNode } from "./tree";
import { findPrimaryImbalance } from "./avlGuide";

function treeFrom(values: number[]) {
  let root: TreeNode | null = null;
  for (const v of values) root = bstInsert(root, v);
  if (!root) throw new Error("empty");
  return root;
}

describe("findPrimaryImbalance", () => {
  it("right spine needs left rotation at Z", () => {
    const root = treeFrom([1, 2, 3]);
    const imbalance = findPrimaryImbalance(root);
    expect(imbalance?.fixKind).toBe("left");
    expect(imbalance?.summary).toBe("Left rotation at Z");
    expect(imbalance?.fixMoves).toEqual([{ type: "L", nodeId: "n-1" }]);
    const roles = new Map(imbalance!.roles.map((r) => [r.nodeId, r.role]));
    expect(roles.get("n-1")).toBe("Z");
    expect(roles.get("n-2")).toBe("C");
    expect(roles.get("n-3")).toBe("G");
  });

  it("left-right hook needs left-right rotation", () => {
    const root = treeFrom([3, 1, 2]);
    const imbalance = findPrimaryImbalance(root);
    expect(imbalance?.fixKind).toBe("left-right");
    expect(imbalance?.fixMoves).toEqual([
      { type: "L", nodeId: "n-1" },
      { type: "R", nodeId: "n-3" },
    ]);
    const roles = new Map(imbalance!.roles.map((r) => [r.nodeId, r.role]));
    expect(roles.get("n-3")).toBe("Z");
    expect(roles.get("n-1")).toBe("C");
    expect(roles.get("n-2")).toBe("G");
  });
});
