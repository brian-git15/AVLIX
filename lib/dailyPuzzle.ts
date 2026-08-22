import { cloneTree, isBalanced, treeSize, type TreeNode } from "./tree";
import { bfsSolveExact } from "./parBfs";
import { generateScramble, type ScrambleMode } from "./scramble";
import {
  difficultyForN,
  thresholdsFor,
  type Level,
} from "./scoring";
import type { Move } from "./rotations";

export const DAILY_N_MIN = 7;
export const DAILY_N_MAX = 12;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function utcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isUtcDateKey(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return dt.toISOString().slice(0, 10) === value;
}

export function previousUtcDateKey(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface DailyPayload {
  date: string;
  n: number;
  scrambledTree: TreeNode;
  parRotations: number;
  parExact: true;
  optimalPath: Move[];
  threshold2: number;
  threshold3: number;
  difficulty: Level["difficulty"];
  title: string;
}

export function dailyLevel(date: string): Level {
  if (!isUtcDateKey(date)) {
    throw new Error(`invalid UTC date key: ${date}`);
  }
  const rng = mulberry32(hashSeed(`avlix-daily-${date}`));
  const n =
    DAILY_N_MIN + Math.floor(rng() * (DAILY_N_MAX - DAILY_N_MIN + 1));
  const mode: ScrambleMode = rng() < 0.5 ? "random-shape" : "random-walk";
  const k = 8 + Math.floor(rng() * 21);

  let tree = generateScramble({ n, mode, k, rng });
  for (let i = 0; i < 24 && isBalanced(tree); i++) {
    tree = generateScramble({ n, mode, k, rng });
  }
  if (isBalanced(tree)) {
    throw new Error(`daily ${date} produced a balanced tree`);
  }

  const snapshot = cloneTree(tree);
  if (!snapshot) throw new Error("empty daily tree");
  const exact = bfsSolveExact(snapshot);
  const difficulty = difficultyForN(n);
  const bands = thresholdsFor(difficulty, true);
  return {
    id: `daily-${date}`,
    n: treeSize(snapshot),
    scrambledTree: snapshot,
    parRotations: exact.parRotations,
    parExact: true,
    optimalPath: exact.path,
    threshold2: bands.threshold2,
    threshold3: bands.threshold3,
    difficulty,
    title: `Daily ${date}`,
    blurb: `${n} nodes · exact optimal par`,
  };
}

export function dailyPayload(date: string): DailyPayload {
  const level = dailyLevel(date);
  return {
    date,
    n: level.n,
    scrambledTree: level.scrambledTree,
    parRotations: level.parRotations,
    parExact: true,
    optimalPath: level.optimalPath ?? [],
    threshold2: level.threshold2,
    threshold3: level.threshold3,
    difficulty: level.difficulty,
    title: level.title ?? `Daily ${date}`,
  };
}

export function levelFromDailyPayload(payload: DailyPayload): Level {
  const scrambledTree = cloneTree(payload.scrambledTree);
  if (!scrambledTree) throw new Error("empty daily payload tree");
  return {
    id: `daily-${payload.date}`,
    n: payload.n,
    scrambledTree,
    parRotations: payload.parRotations,
    parExact: true,
    optimalPath: payload.optimalPath,
    threshold2: payload.threshold2,
    threshold3: payload.threshold3,
    difficulty: payload.difficulty,
    title: payload.title,
    blurb: `${payload.n} nodes · exact optimal par`,
  };
}
