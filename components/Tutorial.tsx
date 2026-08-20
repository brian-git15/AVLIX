"use client";

import { useMemo, useState } from "react";
import { TreeView } from "@/components/TreeView";
import { findPrimaryImbalance, roleMap } from "@/lib/avlGuide";
import { createGame, isSolved, nextHint, playMove, withPlan } from "@/lib/gameState";
import type { Move } from "@/lib/rotations";
import { bstInsert, cloneTree, type TreeNode } from "@/lib/tree";

type Props = {
  onDone: () => void;
  onStartCampaign: () => void;
};

type Slide =
  | { kind: "text"; title: string; body: string }
  | {
      kind: "practice";
      title: string;
      body: string;
      insertOrder: number[];
    };

const SLIDES: Slide[] = [
  {
    kind: "text",
    title: "The goal",
    body:
      "Values stay in sorted order (1 … n). You only change shape by rotating subtrees. " +
      "Win when every node has balance factor between −1 and +1.",
  },
  {
    kind: "text",
    title: "Balance factor",
    body:
      "Each node shows bf = height(left) − height(right). Green means |bf| ≤ 1 (OK). " +
      "Amber is a lean (|bf| = 1). Red means |bf| ≥ 2 — that node is out of AVL balance.",
  },
  {
    kind: "text",
    title: "Rotations",
    body:
      "Left rotation at a node pulls its right child up (needs a right child). " +
      "Right rotation pulls its left child up (needs a left child). " +
      "In-order values never change — only the shape does.",
  },
  {
    kind: "text",
    title: "Z · C · G",
    body:
      "On the heavy path read top to leaf: Z is the tallest node (|bf| ≥ 2), " +
      "C is the child in the middle, G is the leaf at the hook.",
  },
  {
    kind: "text",
    title: "Single rotations",
    body:
      "When Z → C → G all lean the same way: a right-heavy spine needs a left rotation at Z; " +
      "a left-heavy spine needs a right rotation at Z.",
  },
  {
    kind: "text",
    title: "Double rotations",
    body:
      "When G hooks the other way: left-right rotation (left at C, then right at Z) or " +
      "right-left rotation (right at C, then left at Z).",
  },
  {
    kind: "practice",
    title: "Try it — left rotation at Z",
    body:
      "Nodes 1 → 2 → 3 form a right-heavy spine (Z=1, C=2, G=3). " +
      "Select Z and perform a left rotation.",
    insertOrder: [1, 2, 3],
  },
  {
    kind: "practice",
    title: "Try it — left-right rotation",
    body:
      "Z=3, C=1, G=2 (leaf). Left rotation at C first, then right rotation at Z.",
    insertOrder: [3, 1, 2],
  },
];

function treeFromInsertOrder(values: number[]) {
  let root: TreeNode | null = null;
  for (const v of values) root = bstInsert(root, v);
  if (!root) throw new Error("empty");
  return root;
}

function PracticeSlide({
  slide,
}: {
  slide: Extract<Slide, { kind: "practice" }>;
}) {
  const [game, setGame] = useState(() =>
    createGame(cloneTree(treeFromInsertOrder(slide.insertOrder))!),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hinted, setHinted] = useState<Move | null>(null);
  const solved = useMemo(() => isSolved(game), [game]);
  const imbalance = findPrimaryImbalance(game.root);
  const roles = roleMap(imbalance);

  function onHint() {
    const planned = withPlan(game);
    setGame(planned);
    const move = nextHint(planned);
    setHinted(move);
    if (move) setSelectedId(move.nodeId);
  }

  return (
    <>
      <p className="tutorial-copy">{slide.body}</p>
      <div className="tutorial-stage">
        <TreeView
          tree={game.root}
          selectedId={selectedId}
          hintedMove={hinted}
          roleLabels={roles}
          onSelect={setSelectedId}
          onRotate={(move) => {
            setGame(playMove(game, move));
            setSelectedId(null);
            setHinted(null);
          }}
        />
      </div>
      {!solved && (
        <div className="row buttons tutorial-practice-actions">
          <button type="button" onClick={onHint}>
            Hint
          </button>
        </div>
      )}
      {solved ? (
        <p className="tutorial-win">Balanced — nice work.</p>
      ) : (
        <p className="tutorial-tip">
          {hinted
            ? imbalance
              ? `${imbalance.summary}: use the highlighted rotation.`
              : "Follow the highlighted rotation."
            : imbalance
              ? `${imbalance.summary}: ${imbalance.detail}`
              : "Select a node, then choose Left or Right rotation."}
        </p>
      )}
    </>
  );
}

export function Tutorial({ onDone, onStartCampaign }: Props) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const last = index === SLIDES.length - 1;

  return (
    <div className="press">
      <header className="masthead">
        <p className="kicker">Primer — how to read the tree</p>
        <h1>Tutorial</h1>
        <p className="lede">
          Step {index + 1} of {SLIDES.length}
        </p>
      </header>

      <article className="tutorial-card">
        <h2>{slide.title}</h2>
        {slide.kind === "text" ? (
          <p className="tutorial-copy">{slide.body}</p>
        ) : (
          <PracticeSlide
            key={slide.insertOrder.join("-")}
            slide={slide}
          />
        )}
      </article>

      <div className="row buttons tutorial-nav">
        <button type="button" onClick={onDone}>
          Menu
        </button>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          Back
        </button>
        {!last ? (
          <button
            type="button"
            className="accent"
            onClick={() => setIndex((i) => i + 1)}
          >
            Next
          </button>
        ) : (
          <button type="button" className="accent" onClick={onStartCampaign}>
            Start campaign
          </button>
        )}
      </div>
    </div>
  );
}
