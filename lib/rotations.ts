import type { TreeNode } from "./tree";
import { locateNode } from "./tree";

export type RotationType = "L" | "R";

export interface Move {
  type: RotationType;
  nodeId: string;
}

/** Textbook name for a single rotation (CLRS / AVL convention). */
export function rotationLabel(type: RotationType): string {
  return type === "L" ? "Left rotation" : "Right rotation";
}

/** Short label for buttons. */
export function rotationShort(type: RotationType): string {
  return type === "L" ? "L" : "R";
}

export function rotateLeft(node: TreeNode): TreeNode {
  const y = node.right;
  if (!y) {
    throw new Error("rotateLeft requires a right child");
  }
  node.right = y.left;
  y.left = node;
  return y;
}

export function rotateRight(node: TreeNode): TreeNode {
  const x = node.left;
  if (!x) {
    throw new Error("rotateRight requires a left child");
  }
  node.left = x.right;
  x.right = node;
  return x;
}

/** Left-right double rotation: rotate node.left left, then rotate node right. */
export function rotateLeftRight(node: TreeNode): TreeNode {
  if (!node.left) {
    throw new Error("rotateLeftRight requires a left child");
  }
  node.left = rotateLeft(node.left);
  return rotateRight(node);
}

/** Right-left double rotation: rotate node.right right, then rotate node left. */
export function rotateRightLeft(node: TreeNode): TreeNode {
  if (!node.right) {
    throw new Error("rotateRightLeft requires a right child");
  }
  node.right = rotateRight(node.right);
  return rotateLeft(node);
}

export function canRotate(node: TreeNode, type: RotationType): boolean {
  return type === "L" ? node.right !== null : node.left !== null;
}

/**
 * Relink a rotation at `nodeId` into its parent (or replace the tree root).
 * Mutates the tree in place; does not clone.
 */
export function applyMove(root: TreeNode, move: Move): TreeNode {
  const loc = locateNode(root, move.nodeId);
  if (!loc) {
    throw new Error(`No node with id ${move.nodeId}`);
  }
  if (!canRotate(loc.node, move.type)) {
    throw new Error(`Illegal ${move.type} rotation at ${move.nodeId}`);
  }
  const newSubtreeRoot =
    move.type === "L" ? rotateLeft(loc.node) : rotateRight(loc.node);
  if (!loc.parent) {
    return newSubtreeRoot;
  }
  if (loc.side === "left") {
    loc.parent.left = newSubtreeRoot;
  } else {
    loc.parent.right = newSubtreeRoot;
  }
  return root;
}

export function inverseMove(move: Move, newSubtreeRootId: string): Move {
  return {
    type: move.type === "L" ? "R" : "L",
    nodeId: newSubtreeRootId,
  };
}

export function subtreeRootAfterMove(node: TreeNode, type: RotationType): TreeNode {
  if (type === "L") {
    if (!node.right) throw new Error("no right child");
    return node.right;
  }
  if (!node.left) throw new Error("no left child");
  return node.left;
}
