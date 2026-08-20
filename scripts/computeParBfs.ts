/**
 * Build-time only — not imported by the client bundle.
 * Usage: npx tsx scripts/computeParBfs.ts
 *
 * Prints bfsMinRotations for a right spine of n=7 as a smoke check.
 * Curated levels should store { parRotations, parExact: true } in static JSON.
 */
import { bstInsert, type TreeNode } from "../lib/tree";
import { BFS_MAX_N, bfsSolveExact } from "../lib/parBfs";

function spine(n: number): TreeNode {
  let root: TreeNode | null = null;
  for (let v = 1; v <= n; v++) root = bstInsert(root, v);
  return root!;
}

const n = Number(process.argv[2] ?? 7);
if (n > BFS_MAX_N) {
  console.error(`Refusing n=${n}; max is ${BFS_MAX_N}`);
  process.exit(1);
}

const exact = bfsSolveExact(spine(n));
console.log(JSON.stringify({ n, ...exact }));
