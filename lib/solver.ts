import {
  balanceFactors,
  cloneTree,
  collectNodes,
  createNode,
  isBalanced,
  treeSize,
  type TreeNode,
} from "./tree";
import { applyMove, canRotate, rotateLeft, rotateRight, type Move } from "./rotations";

export interface SolveResult {
  tree: TreeNode;
  moves: Move[];
}

export interface DswSolve {
  moves: Move[];
  parRotations: number;
}

export type ProceduralSolve = DswSolve;

function totalAbsBalanceFactor(node: TreeNode | null): number {
  if (!node) return 0;
  let sum = 0;
  for (const bf of balanceFactors(node).values()) sum += Math.abs(bf);
  return sum;
}

function legalRotationMoves(root: TreeNode): Move[] {
  const moves: Move[] = [];
  for (const node of collectNodes(root)) {
    if (canRotate(node, "L")) moves.push({ type: "L", nodeId: node.id });
    if (canRotate(node, "R")) moves.push({ type: "R", nodeId: node.id });
  }
  return moves;
}

/**
 * Greedy local search: each step picks the rotation that most reduces
 * sum(|balance factor|). Often much tighter than DSW on mild scrambles.
 * Mutates `tree`.
 */
export function greedyBalance(tree: TreeNode): SolveResult {
  const moves: Move[] = [];
  let root = tree;
  const limit = Math.max(1, treeSize(root) ** 2 * 4);
  let guard = 0;

  while (!isBalanced(root)) {
    if (guard++ > limit) {
      throw new Error("greedy solver exceeded step limit");
    }
    const currentScore = totalAbsBalanceFactor(root);
    let bestMove: Move | null = null;
    let bestScore = Infinity;

    for (const move of legalRotationMoves(root)) {
      const candidate = applyMove(cloneTree(root)!, move);
      const score = totalAbsBalanceFactor(candidate);
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    if (!bestMove || bestScore >= currentScore) {
      break;
    }

    root = applyMove(root, bestMove);
    moves.push(bestMove);
  }

  return { tree: root, moves };
}

/** Clone-safe greedy solve; returns null if it stalls before balancing. */
export function greedySolve(tree: TreeNode): ProceduralSolve | null {
  if (isBalanced(tree)) {
    return { moves: [], parRotations: 0 };
  }
  const copy = cloneTree(tree);
  if (!copy) return { moves: [], parRotations: 0 };
  const { tree: balanced, moves } = greedyBalance(copy);
  if (!isBalanced(balanced)) return null;
  return { moves, parRotations: moves.length };
}

/**
 * Procedural par: min(DSW, greedy) move count — still an upper bound,
 * but usually much closer to skilled play than DSW alone.
 */
export function proceduralParSolve(tree: TreeNode): ProceduralSolve {
  if (isBalanced(tree)) {
    return { moves: [], parRotations: 0 };
  }
  const dsw = dswSolve(tree);
  const greedy = greedySolve(tree);
  if (!greedy) return dsw;
  return greedy.parRotations <= dsw.parRotations ? greedy : dsw;
}

/**
 * Day–Stout–Warren: vine (right spine) then compress.
 * Mutates `tree`. Prefer {@link dswSolve} at runtime (clones first).
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

/**
 * Clone-safe DSW used for par and auto-solve.
 * Already-balanced trees get par 0 (DSW would otherwise vine then recompress).
 */
export function dswSolve(tree: TreeNode): DswSolve {
  if (isBalanced(tree)) {
    return { moves: [], parRotations: 0 };
  }
  const copy = cloneTree(tree);
  if (!copy) return { moves: [], parRotations: 0 };
  const { moves } = dswBalance(copy);
  return { moves, parRotations: moves.length };
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
