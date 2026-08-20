import {
  cloneTree,
  collectNodes,
  isBalanced,
  treeSize,
  type TreeNode,
} from "./tree";
import { applyMove, canRotate, type Move } from "./rotations";

/** Catalan C(13) ≈ 9.7M — refuse larger at build time. */
export const BFS_MAX_N = 13;
/** Safe ceiling for exact par during normal procedural level creation. */
export const RUNTIME_EXACT_PAR_MAX_N = 10;

export interface BfsParResult {
  parRotations: number;
  path: Move[];
  parExact: true;
}

export function shapeKey(node: TreeNode | null): string {
  if (!node) return ".";
  return `(${shapeKey(node.left)}${shapeKey(node.right)})`;
}

function legalMoves(root: TreeNode): Move[] {
  const moves: Move[] = [];
  for (const node of collectNodes(root)) {
    if (canRotate(node, "L")) moves.push({ type: "L", nodeId: node.id });
    if (canRotate(node, "R")) moves.push({ type: "R", nodeId: node.id });
  }
  return moves;
}

/**
 * Multi-target BFS: shortest path to the nearest AVL-balanced shape.
 * Build-time / tests only — not for client n > ~13.
 */
export function bfsSolveExact(scrambledTree: TreeNode): BfsParResult {
  const n = treeSize(scrambledTree);
  if (n > BFS_MAX_N) {
    throw new Error(
      `bfsSolveExact refuses n=${n} (max ${BFS_MAX_N}; Catalan blow-up)`,
    );
  }
  const start = cloneTree(scrambledTree);
  if (!start) {
    return { parRotations: 0, path: [], parExact: true };
  }
  if (isBalanced(start)) {
    return { parRotations: 0, path: [], parExact: true };
  }

  const seen = new Set<string>([shapeKey(start)]);
  const queue: Array<{ tree: TreeNode; path: Move[] }> = [
    { tree: start, path: [] },
  ];

  while (queue.length > 0) {
    const { tree, path } = queue.shift()!;
    for (const move of legalMoves(tree)) {
      const next = applyMove(cloneTree(tree)!, move);
      const key = shapeKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      const nextPath = [...path, move];
      if (isBalanced(next)) {
        return {
          parRotations: nextPath.length,
          path: nextPath,
          parExact: true,
        };
      }
      queue.push({ tree: next, path: nextPath });
    }
  }

  throw new Error("rotation graph is connected; a balanced shape should exist");
}

export function bfsMinRotations(scrambledTree: TreeNode): number {
  return bfsSolveExact(scrambledTree).parRotations;
}
