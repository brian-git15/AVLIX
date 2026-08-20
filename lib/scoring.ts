import { cloneTree, treeSize, type TreeNode } from "./tree";
import { bfsSolveExact, RUNTIME_EXACT_PAR_MAX_N } from "./parBfs";
import type { Move } from "./rotations";
import { dswSolve, proceduralParSolve } from "./solver";

export interface RotationPar {
  parRotations: number;
  parExact: boolean;
}

export interface StarThresholds {
  /** Ratio at/below this = 2 stars. */
  threshold2: number;
  /** Ratio at/below this = 1 star. */
  threshold3: number;
}

export type Difficulty = "tutorial" | "easy" | "medium" | "hard" | "expert";

export interface Level {
  id: string;
  n: number;
  scrambledTree: TreeNode;
  parRotations: number;
  parExact: boolean;
  optimalPath?: Move[];
  threshold2: number;
  threshold3: number;
  difficulty: Difficulty;
  title?: string;
  blurb?: string;
}

const BASE_THRESHOLDS: Record<Difficulty, StarThresholds> = {
  tutorial: { threshold2: 1.7, threshold3: 2.8 },
  easy: { threshold2: 1.5, threshold3: 2.5 },
  medium: { threshold2: 1.4, threshold3: 2.3 },
  hard: { threshold2: 1.35, threshold3: 2.2 },
  expert: { threshold2: 1.3, threshold3: 2.1 },
};

/** Widen bands on heuristic procedural par so 3-star play is not stingy. */
const PROCEDURAL_SLACK = 1.12;

export function difficultyForN(n: number): Difficulty {
  if (n <= 7) return "tutorial";
  if (n <= 15) return "easy";
  if (n <= 31) return "medium";
  return "hard";
}

export function thresholdsFor(
  difficulty: Difficulty,
  parExact: boolean,
): StarThresholds {
  const base = BASE_THRESHOLDS[difficulty];
  if (parExact) return { ...base };
  return {
    threshold2: base.threshold2 * PROCEDURAL_SLACK,
    threshold3: base.threshold3 * PROCEDURAL_SLACK,
  };
}

export function computeStars(
  rotationsUsed: number,
  par: RotationPar,
  thresholds: StarThresholds,
): 0 | 1 | 2 | 3 {
  if (par.parRotations <= 0) {
    return rotationsUsed <= 0 ? 3 : 0;
  }
  if (rotationsUsed <= par.parRotations) return 3;
  const ratio = rotationsUsed / par.parRotations;
  if (ratio <= thresholds.threshold2) return 2;
  if (ratio <= thresholds.threshold3) return 1;
  return 0;
}

export function parLabel(par: RotationPar): string {
  const n = par.parRotations;
  return par.parExact ? `optimal: ${n} moves` : `par: ${n} moves`;
}

export function proceduralLevel(tree: TreeNode, id?: string): Level {
  const n = treeSize(tree);
  const snapshot = cloneTree(tree);
  if (!snapshot) throw new Error("empty tree");
  const difficulty = difficultyForN(n);
  const exact = n <= RUNTIME_EXACT_PAR_MAX_N ? bfsSolveExact(snapshot) : null;
  const procedural = exact ? null : proceduralParSolve(snapshot);
  const parRotations = exact ? exact.parRotations : procedural!.parRotations;
  const parExact = exact?.parExact ?? false;
  const bands = thresholdsFor(difficulty, parExact);
  return {
    id: id ?? `proc-${n}`,
    n,
    scrambledTree: snapshot,
    parRotations,
    parExact,
    optimalPath: exact?.path ?? procedural?.moves,
    threshold2: bands.threshold2,
    threshold3: bands.threshold3,
    difficulty,
  };
}
