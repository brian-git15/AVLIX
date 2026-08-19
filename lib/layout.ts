import { height, type TreeNode } from "./tree";

export interface Point {
  x: number;
  y: number;
}

export interface TreeLayout {
  positions: Map<string, Point>;
  width: number;
  height: number;
}

export function layoutTree(
  root: TreeNode,
  xGap = 56,
  yGap = 78,
  padding = 72,
): TreeLayout {
  const positions = new Map<string, Point>();
  let index = 0;
  const walk = (node: TreeNode | null, depth: number) => {
    if (!node) return;
    walk(node.left, depth + 1);
    positions.set(node.id, {
      x: padding + index * xGap,
      y: padding + depth * yGap,
    });
    index += 1;
    walk(node.right, depth + 1);
  };
  walk(root, 0);
  const treeH = Math.max(0, height(root));
  return {
    positions,
    width: padding * 2 + Math.max(0, index - 1) * xGap,
    height: padding * 2 + treeH * yGap,
  };
}

export function collectEdges(
  root: TreeNode,
): Array<{ from: string; to: string }> {
  const edges: Array<{ from: string; to: string }> = [];
  const walk = (node: TreeNode) => {
    if (node.left) {
      edges.push({ from: node.id, to: node.left.id });
      walk(node.left);
    }
    if (node.right) {
      edges.push({ from: node.id, to: node.right.id });
      walk(node.right);
    }
  };
  walk(root);
  return edges;
}
