import { describe, expect, it } from "vitest";
import { expectedInOrder, inOrderTraversal, isBalanced } from "./tree";
import { applyMove } from "./rotations";
import {
  createGame,
  isSolved,
  nextHint,
  playMove,
  resetGame,
  undoMove,
  withPlan,
} from "./gameState";
import { bstInsert, type TreeNode } from "./tree";

function spine(n: number): TreeNode {
  let root: TreeNode | null = null;
  for (let v = 1; v <= n; v++) root = bstInsert(root, v);
  return root!;
}

describe("gameState", () => {
  it("applies a move, counts it, and undoes with the inverse", () => {
    const start = spine(3);
    let game = createGame(start);
    expect(inOrderTraversal(game.root)).toEqual(expectedInOrder(3));

    game = playMove(game, { type: "L", nodeId: "n-1" });
    expect(game.moveCount).toBe(1);
    expect(inOrderTraversal(game.root)).toEqual(expectedInOrder(3));
    expect(game.root.value).toBe(2);

    game = undoMove(game);
    expect(game.moveCount).toBe(0);
    expect(game.root.value).toBe(1);
    expect(inOrderTraversal(game.root)).toEqual(expectedInOrder(3));
  });

  it("reset restores the scramble shape", () => {
    let game = createGame(spine(4));
    game = playMove(game, { type: "L", nodeId: "n-1" });
    game = playMove(game, { type: "L", nodeId: "n-2" });
    game = resetGame(game);
    expect(game.moveCount).toBe(0);
    expect(game.root.value).toBe(1);
    expect(inOrderTraversal(game.root)).toEqual(expectedInOrder(4));
  });

  it("hint from DSW can be applied until solved", () => {
    let game = createGame(spine(7));
    expect(isSolved(game)).toBe(false);
    let guard = 0;
    while (!isSolved(game) && guard < 200) {
      game = withPlan(game);
      const hint = nextHint(game);
      if (!hint) break;
      game = playMove(game, hint);
      guard += 1;
    }
    expect(isBalanced(game.root)).toBe(true);
    expect(inOrderTraversal(game.root)).toEqual(expectedInOrder(7));
  });

  it("applyMove via engine matches rotations.applyMove", () => {
    const a = spine(5);
    const b = spine(5);
    const game = playMove(createGame(a), { type: "L", nodeId: "n-1" });
    const direct = applyMove(b, { type: "L", nodeId: "n-1" });
    expect(game.root.value).toBe(direct.value);
  });
});
