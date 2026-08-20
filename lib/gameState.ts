import {
  assertInOrderUnchanged,
  cloneTree,
  isBalanced,
  locateNode,
  treeSize,
  type TreeNode,
} from "./tree";
import { bfsSolveExact } from "./parBfs";
import {
  applyMove,
  inverseMove,
  subtreeRootAfterMove,
  type Move,
} from "./rotations";
import { proceduralParSolve } from "./solver";
import { generateScramble, type ScrambleMode } from "./scramble";
import { proceduralLevel, type Level } from "./scoring";

export interface HistoryEntry {
  move: Move;
  undo: Move;
}

export interface GameState {
  root: TreeNode;
  original: TreeNode;
  n: number;
  history: HistoryEntry[];
  moveCount: number;
  /** Remaining DSW moves from the last planned solution; cleared if the player diverges. */
  plan: Move[];
  level: Level;
}

export function createGame(root: TreeNode, level?: Level): GameState {
  const copy = cloneTree(root);
  if (!copy) throw new Error("empty tree");
  return {
    root,
    original: copy,
    n: treeSize(root),
    history: [],
    moveCount: 0,
    plan: [],
    level: level ?? proceduralLevel(root),
  };
}

export function newGame(n: number, mode: ScrambleMode, k?: number): GameState {
  return createGame(generateScramble({ n, mode, k }));
}

export function createGameFromLevel(level: Level): GameState {
  const root = cloneTree(level.scrambledTree);
  if (!root) throw new Error("empty level tree");
  return createGame(root, level);
}

export function playMove(state: GameState, move: Move): GameState {
  const loc = locateNode(state.root, move.nodeId);
  if (!loc) return state;
  const nextRootId = subtreeRootAfterMove(loc.node, move.type).id;
  const root = applyMove(state.root, move);
  assertInOrderUnchanged(root);
  const undo = inverseMove(move, nextRootId);
  const planned = state.plan[0] ?? null;
  const plan =
    planned && planned.type === move.type && planned.nodeId === move.nodeId
      ? state.plan.slice(1)
      : [];
  return {
    ...state,
    root,
    history: [...state.history, { move, undo }],
    moveCount: state.moveCount + 1,
    plan,
  };
}

export function undoMove(state: GameState): GameState {
  if (state.history.length === 0) return state;
  const history = state.history.slice();
  const last = history.pop()!;
  const root = applyMove(state.root, last.undo);
  assertInOrderUnchanged(root);
  return {
    ...state,
    root,
    history,
    moveCount: Math.max(0, state.moveCount - 1),
    plan: [],
  };
}

export function resetGame(state: GameState): GameState {
  const restored = cloneTree(state.original);
  if (!restored) throw new Error("empty original");
  return {
    ...state,
    root: restored,
    original: cloneTree(restored)!,
    history: [],
    moveCount: 0,
    plan: [],
  };
}

export function isSolved(state: GameState): boolean {
  return isBalanced(state.root);
}

/** Exact BFS for curated/exact levels; min(DSW, greedy) for procedural. */
export function solutionMoves(state: GameState): Move[] {
  if (state.level.parExact) {
    if (state.history.length === 0 && state.level.optimalPath) {
      return state.level.optimalPath;
    }
    return bfsSolveExact(state.root).path;
  }
  if (state.history.length === 0 && state.level.optimalPath) {
    return state.level.optimalPath;
  }
  return proceduralParSolve(state.root).moves;
}

export function withPlan(state: GameState): GameState {
  if (state.plan.length > 0) return state;
  return { ...state, plan: solutionMoves(state) };
}

export function nextHint(state: GameState): Move | null {
  const planned = withPlan(state);
  return planned.plan[0] ?? null;
}
