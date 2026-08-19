"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TreeView } from "@/components/TreeView";
import {
  isSolved,
  nextHint,
  newGame,
  playMove,
  resetGame,
  solutionMoves,
  undoMove,
  withPlan,
  type GameState,
} from "@/lib/gameState";
import type { Move } from "@/lib/rotations";
import type { ScrambleMode } from "@/lib/scramble";

const SIZES = [7, 15, 31] as const;

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function GameApp() {
  const [n, setN] = useState<(typeof SIZES)[number]>(7);
  const [mode, setMode] = useState<ScrambleMode>("random-shape");
  const [k, setK] = useState(12);
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hinted, setHinted] = useState<Move | null>(null);
  const [tick, setTick] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [win, setWin] = useState<{ moves: number; time: number } | null>(null);
  const [demo, setDemo] = useState(false);
  const autoRef = useRef<number | null>(null);

  useEffect(() => {
    setGame(newGame(7, "random-shape"));
  }, []);

  useEffect(() => {
    if (startedAt === null || win) return;
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(id);
  }, [startedAt, win]);

  useEffect(() => {
    return () => {
      if (autoRef.current) window.clearTimeout(autoRef.current);
    };
  }, []);

  const solved = useMemo(() => (game ? isSolved(game) : false), [game, tick]);

  useEffect(() => {
    if (!game || !solved || win || autoPlaying) return;
    if (game.moveCount === 0 && !demo) return;
    setWin({
      moves: game.moveCount,
      time: elapsed || Date.now() - (startedAt ?? Date.now()),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, autoPlaying, game]);

  function bump(next: GameState) {
    setGame(next);
    setTick((t) => t + 1);
    setHinted(null);
  }

  function ensureTimer() {
    if (startedAt === null) setStartedAt(Date.now());
  }

  function scrambleNew(size = n, scrambleMode = mode, depth = k) {
    if (autoRef.current) window.clearTimeout(autoRef.current);
    setAutoPlaying(false);
    setDemo(false);
    bump(newGame(size, scrambleMode, depth));
    setSelectedId(null);
    setStartedAt(null);
    setElapsed(0);
    setWin(null);
  }

  function rotate(move: Move) {
    if (!game || autoPlaying || win) return;
    ensureTimer();
    bump(playMove(game, move));
    setSelectedId(null);
  }

  function onHint() {
    if (!game || autoPlaying) return;
    const planned = withPlan(game);
    setGame(planned);
    setHinted(nextHint(planned));
  }

  function onAutoSolve() {
    if (!game || autoPlaying) return;
    const planned = withPlan(game);
    const moves = planned.plan.length ? planned.plan : solutionMoves(planned);
    setGame({ ...planned, plan: moves });
    setDemo(true);
    setAutoPlaying(true);
    setSelectedId(null);
    setHinted(null);
    playQueue(planned, moves, 0);
  }

  function playQueue(state: GameState, moves: Move[], index: number) {
    if (index >= moves.length) {
      setAutoPlaying(false);
      setGame(state);
      setTick((t) => t + 1);
      setWin({
        moves: state.moveCount,
        time: elapsed,
      });
      return;
    }
    const next = playMove(state, moves[index]!);
    setGame(next);
    setTick((t) => t + 1);
    autoRef.current = window.setTimeout(() => {
      playQueue(next, moves, index + 1);
    }, 420);
  }

  if (!game) {
    return (
      <div className="press">
        <header className="masthead">
          <p className="kicker">Workshop No. 1 — tree shapes only</p>
          <h1>AVLIX</h1>
          <p className="lede">Setting the type…</p>
        </header>
      </div>
    );
  }

  return (
    <div className="press">
      <header className="masthead">
        <p className="kicker">Workshop No. 1 — tree shapes only</p>
        <h1>AVLIX</h1>
        <p className="lede">
          A Rubik’s cube for binary trees. In-order is already 1…n; rotations
          never unsort it. Restore the AVL invariant: every node’s balance
          factor stays in {"{−1, 0, +1}"}.
        </p>
      </header>

      <section className="hud">
        <div className="stat">
          <span>Moves</span>
          <strong>{game.moveCount}</strong>
        </div>
        <div className="stat">
          <span>Time</span>
          <strong>{formatTime(elapsed)}</strong>
        </div>
        <div className="stat">
          <span>Nodes</span>
          <strong>{game.n}</strong>
        </div>
        <div className="legend">
          <i className="swatch ok" /> |bf| 0
          <i className="swatch warn" /> |bf| 1
          <i className="swatch bad" /> |bf| ≥ 2
        </div>
      </section>

      <section className="stage">
        <TreeView
          tree={game.root}
          selectedId={selectedId}
          hintedMove={hinted}
          disabled={autoPlaying || !!win}
          onSelect={setSelectedId}
          onRotate={rotate}
        />
      </section>

      <section className="controls">
        <div className="row">
          <label>
            Size
            <select
              value={n}
              onChange={(e) => {
                const size = Number(e.target.value) as (typeof SIZES)[number];
                setN(size);
                scrambleNew(size, mode, k);
              }}
            >
              {SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} nodes
                </option>
              ))}
            </select>
          </label>
          <label>
            Scramble
            <select
              value={mode}
              onChange={(e) => {
                const next = e.target.value as ScrambleMode;
                setMode(next);
                scrambleNew(n, next, k);
              }}
            >
              <option value="random-shape">Random shape</option>
              <option value="random-walk">Random walk</option>
            </select>
          </label>
          {mode === "random-walk" && (
            <label className="grow">
              Depth k = {k}
              <input
                type="range"
                min={4}
                max={40}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                onMouseUp={(e) => {
                  const depth = Number((e.target as HTMLInputElement).value);
                  setK(depth);
                  scrambleNew(n, mode, depth);
                }}
                onTouchEnd={(e) => {
                  const depth = Number((e.target as HTMLInputElement).value);
                  setK(depth);
                  scrambleNew(n, mode, depth);
                }}
              />
            </label>
          )}
        </div>
        <div className="row buttons">
          <button
            type="button"
            onClick={() => bump(undoMove(game))}
            disabled={autoPlaying || game.history.length === 0}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => {
              bump(resetGame(game));
              setSelectedId(null);
              setStartedAt(null);
              setElapsed(0);
              setWin(null);
              setDemo(false);
            }}
            disabled={autoPlaying}
          >
            Reset
          </button>
          <button type="button" onClick={() => scrambleNew()} disabled={autoPlaying}>
            New scramble
          </button>
          <button type="button" onClick={onHint} disabled={autoPlaying || solved}>
            Hint
          </button>
          <button type="button" className="accent" onClick={onAutoSolve} disabled={autoPlaying || solved}>
            Auto-solve
          </button>
        </div>
        <p className="footnote">
          Auto-solve replays a Day–Stout–Warren solution — a correct sequence,
          not a shortest one. Minimum rotation distance is a hard problem; we
          do not claim optimality.
        </p>
      </section>

      {win && (
        <div className="veil" role="dialog" aria-modal="true" aria-labelledby="win-title">
          <div className="stamp">
            <p className="stamp-kicker">{demo ? "Demonstration" : "Balanced"}</p>
            <h2 id="win-title">{demo ? "Solution replay" : "The press is even"}</h2>
            <p>
              {demo
                ? "A DSW solution, not an optimal one."
                : "Every node has |balance factor| ≤ 1."}
            </p>
            <dl>
              <div>
                <dt>Moves</dt>
                <dd>{win.moves}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{formatTime(win.time)}</dd>
              </div>
            </dl>
            <button type="button" className="accent" onClick={() => scrambleNew()}>
              New scramble
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
