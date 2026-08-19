import {
  bstInsert,
  buildBalancedBst,
  collectNodes,
  isBalanced,
  type TreeNode,
} from "./tree";
import { applyMove, canRotate, type Move, type RotationType } from "./rotations";

export type ScrambleMode = "random-shape" | "random-walk";

export interface ScrambleOptions {
  n: number;
  mode: ScrambleMode;
  /** Rotation count for random-walk mode. */
  k?: number;
  rng?: () => number;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function randomShapeScramble(
  n: number,
  rng: () => number = Math.random,
  maxAttempts = 80,
): TreeNode {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const values = shuffle(
      Array.from({ length: n }, (_, i) => i + 1),
      rng,
    );
    let root: TreeNode | null = null;
    for (const v of values) {
      root = bstInsert(root, v);
    }
    if (root && !isBalanced(root)) return root;
  }
  const values = shuffle(
    Array.from({ length: n }, (_, i) => i + 1),
    rng,
  );
  let root: TreeNode | null = null;
  for (const v of values) {
    root = bstInsert(root, v);
  }
  if (!root) throw new Error("failed to build scramble");
  return root;
}

function randomLegalMove(root: TreeNode, rng: () => number): Move | null {
  const candidates: Move[] = [];
  for (const node of collectNodes(root)) {
    if (canRotate(node, "L")) candidates.push({ type: "L", nodeId: node.id });
    if (canRotate(node, "R")) candidates.push({ type: "R", nodeId: node.id });
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)]!;
}

export function randomWalkScramble(
  n: number,
  k: number,
  rng: () => number = Math.random,
): TreeNode {
  let root = buildBalancedBst(n);
  for (let i = 0; i < k; i++) {
    const move = randomLegalMove(root, rng);
    if (!move) break;
    root = applyMove(root, move);
  }
  if (isBalanced(root) && k > 0) {
    const extra = randomLegalMove(root, rng);
    if (extra) root = applyMove(root, extra);
  }
  return root;
}

export function generateScramble(options: ScrambleOptions): TreeNode {
  const rng = options.rng ?? Math.random;
  if (options.mode === "random-walk") {
    return randomWalkScramble(options.n, options.k ?? options.n, rng);
  }
  return randomShapeScramble(options.n, rng);
}

export function legalRotations(node: TreeNode): RotationType[] {
  const types: RotationType[] = [];
  if (canRotate(node, "L")) types.push("L");
  if (canRotate(node, "R")) types.push("R");
  return types;
}
