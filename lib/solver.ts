import { createNode, type TreeNode } from "./tree";
import { rotateLeft, rotateRight, type Move } from "./rotations";

export interface SolveResult {
  tree: TreeNode;
  moves: Move[];
}

/**
 * Day–Stout–Warren: vine (right spine) then compress.
 * Returns a balanced tree and the rotation list used (a solution, not a shortest one).
 */
export function dswBalance(tree: TreeNode): SolveResult {
  const moves: Move[] = [];
  const dummy = createDummy(tree);

  const size = treeToVine(dummy, moves);
  vineToTree(dummy, size, moves);

  if (!dummy.right) {
    throw new Error("DSW produced an empty tree");
  }
  return { tree: dummy.right, moves };
}

function createDummy(tree: TreeNode): TreeNode {
  const dummy = createNode(-1);
  dummy.id = "__dummy__";
  dummy.right = tree;
  return dummy;
}

function treeToVine(dummy: TreeNode, moves: Move[]): number {
  let size = 0;
  let tail = dummy;
  let rest = tail.right;
  while (rest) {
    if (rest.left) {
      moves.push({ type: "R", nodeId: rest.id });
      rest = rotateRight(rest);
      tail.right = rest;
    } else {
      size += 1;
      tail = rest;
      rest = rest.right;
    }
  }
  return size;
}

function compress(dummy: TreeNode, count: number, moves: Move[]): void {
  let scanner = dummy;
  for (let i = 0; i < count; i++) {
    const child = scanner.right;
    if (!child?.right) break;
    moves.push({ type: "L", nodeId: child.id });
    const lifted = rotateLeft(child);
    scanner.right = lifted;
    scanner = lifted;
  }
}

function vineToTree(dummy: TreeNode, size: number, moves: Move[]): void {
  const leaves = size + 1 - 2 ** Math.floor(Math.log2(size + 1));
  compress(dummy, leaves, moves);
  let remaining = size - leaves;
  while (remaining > 1) {
    remaining = Math.floor(remaining / 2);
    compress(dummy, remaining, moves);
  }
}
