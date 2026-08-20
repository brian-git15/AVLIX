"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CoachPanel } from "@/components/CoachPanel";
import { TreeView } from "@/components/TreeView";
import { findPrimaryImbalance, roleMap } from "@/lib/avlGuide";
import {
  isSolved,
  nextHint,
  playMove,
  resetGame,
  solutionMoves,
  undoMove,
  withPlan,
  type GameState,
} from "@/lib/gameState";
import type { Move } from "@/lib/rotations";
import type { ScrambleMode } from "@/lib/scramble";
import { computeStars, parLabel } from "@/lib/scoring";

const SIZES = [7, 15, 31] as const;

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type FreePlayProps = {
  variant: "free";
  initialGame: GameState;
  onExit: () => void;
  onNewScramble: (
    size: (typeof SIZES)[number],
    mode: ScrambleMode,
    k: number,
  ) => GameState;
};

type CampaignProps = {
  variant: "campaign";
  initialGame: GameState;
  levelTitle: string;
  levelNumber: number;
  onExit: () => void;
  onComplete: (stars: 0 | 1 | 2 | 3, moves: number, time: number) => void;
  onNextLevel?: () => void;
  hasNextLevel: boolean;
};

export type PuzzleSessionProps = FreePlayProps | CampaignProps;

export function PuzzleSession(props: PuzzleSessionProps) {
  const [game, setGame] = useState(props.initialGame);
  const [n, setN] = useState<(typeof SIZES)[number]>(7);
  const [mode, setMode] = useState<ScrambleMode>("random-shape");
  const [k, setK] = useState(12);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hinted, setHinted] = useState<Move | null>(null);
  const [tick, setTick] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [win, setWin] = useState<{ moves: number; time: number } | null>(null);
  const [showWin, setShowWin] = useState(true);
  const [demo, setDemo] = useState(false);
  const [reportedWin, setReportedWin] = useState(false);
  const [guideOn, setGuideOn] = useState(false);
  const autoRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (autoRef.current) window.clearTimeout(autoRef.current);
    };
  }, []);

  useEffect(() => {
    if (startedAt === null || win) return;
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(id);
  }, [startedAt, win]);

  const solved = useMemo(() => isSolved(game), [game, tick]);
  const roleLabels = useMemo(() => {
    if (!guideOn || solved) return undefined;
    return roleMap(findPrimaryImbalance(game.root));
  }, [guideOn, solved, game, tick]);

  useEffect(() => {
    if (!solved || win || autoPlaying) return;
    if (game.moveCount === 0 && !demo) return;
    const result = {
      moves: game.moveCount,
      time: elapsed || Date.now() - (startedAt ?? Date.now()),
    };
    setWin(result);
    setShowWin(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, autoPlaying, game]);

  useEffect(() => {
    if (props.variant !== "campaign" || !win || reportedWin) return;
    const stars = computeStars(win.moves, game.level, game.level);
    props.onComplete(stars, win.moves, win.time);
    setReportedWin(true);
  }, [win, reportedWin, props, game.level]);

  function bump(next: GameState) {
    setGame(next);
    setTick((t) => t + 1);
    setHinted(null);
  }

  function ensureTimer() {
    if (startedAt === null) setStartedAt(Date.now());
  }

  function scrambleNew(size = n, scrambleMode = mode, depth = k) {
    if (props.variant !== "free") return;
    if (autoRef.current) window.clearTimeout(autoRef.current);
    setAutoPlaying(false);
    setDemo(false);
    setReportedWin(false);
    bump(props.onNewScramble(size, scrambleMode, depth));
    setSelectedId(null);
    setStartedAt(null);
    setElapsed(0);
    setWin(null);
    setShowWin(true);
  }

  function rotate(move: Move) {
    if (autoPlaying || win) return;
    ensureTimer();
    bump(playMove(game, move));
    setSelectedId(null);
  }

  function onHint() {
    if (autoPlaying) return;
    const planned = withPlan(game);
    setGame(planned);
    const move = nextHint(planned);
    setHinted(move);
    if (move) setSelectedId(move.nodeId);
  }

  function onAutoSolve() {
    if (autoPlaying) return;
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
      setWin({ moves: state.moveCount, time: elapsed });
      setShowWin(true);
      return;
    }
    const next = playMove(state, moves[index]!);
    setGame(next);
    setTick((t) => t + 1);
    autoRef.current = window.setTimeout(() => {
      playQueue(next, moves, index + 1);
    }, 420);
  }

  useEffect(() => {
    if (!win || !showWin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowWin(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [win, showWin]);

  const earnedStars = win
    ? computeStars(win.moves, game.level, game.level)
    : 0;

  const solveCopy = game.level.parExact
    ? "Auto-solve replays the optimal rotation sequence for this puzzle."
    : "Auto-solve replays the tighter of greedy local search and DSW — still an upper bound, not necessarily shortest.";

  return (
    <div className="press press-play">
      <header className="masthead masthead-play">
        <p className="kicker">
          {props.variant === "campaign"
            ? `Campaign — ${props.levelTitle}`
            : "Workshop — free scramble"}
        </p>
        <h1>AVLIX</h1>
      </header>

      <section className="hud">
        <div className="stat">
          <span>Moves</span>
          <strong>{game.moveCount}</strong>
        </div>
        <div className="stat">
          <span>{game.level.parExact ? "Optimal" : "Par"}</span>
          <strong>{game.level.parRotations}</strong>
        </div>
        <div className="stat">
          <span>Time</span>
          <strong>{formatTime(elapsed)}</strong>
        </div>
        {props.variant === "campaign" ? (
          <div className="stat">
            <span>Level</span>
            <strong>{props.levelNumber}</strong>
          </div>
        ) : (
          <div className="stat">
            <span>Nodes</span>
            <strong>{game.n}</strong>
          </div>
        )}
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
          roleLabels={roleLabels}
          compact
          disabled={autoPlaying || !!win}
          onSelect={setSelectedId}
          onRotate={rotate}
        />
      </section>

      <CoachPanel
        tree={game.root}
        hinted={hinted}
        guideOn={guideOn}
        onToggleGuide={() => setGuideOn((g) => !g)}
      />

      <section className="controls">
        {props.variant === "free" && (
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
        )}
        <div className="row buttons">
          <button type="button" onClick={props.onExit}>
            {props.variant === "campaign" ? "Map" : "Menu"}
          </button>
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
              setShowWin(true);
              setDemo(false);
              setReportedWin(false);
            }}
            disabled={autoPlaying}
          >
            Reset
          </button>
          {props.variant === "free" && (
            <button type="button" onClick={() => scrambleNew()} disabled={autoPlaying}>
              New scramble
            </button>
          )}
          <button type="button" onClick={onHint} disabled={autoPlaying || solved}>
            Hint
          </button>
          <button
            type="button"
            className="accent"
            onClick={onAutoSolve}
            disabled={autoPlaying || solved}
          >
            Auto-solve
          </button>
          {win && !showWin && (
            <button type="button" onClick={() => setShowWin(true)}>
              Results
            </button>
          )}
        </div>
        <p className="footnote">
          {guideOn
            ? "Select a node. Left rotation pulls the right child up; right rotation pulls the left child up."
            : solveCopy}
        </p>
      </section>

      {win && showWin && (
        <div
          className="veil"
          role="dialog"
          aria-modal="true"
          aria-labelledby="win-title"
          onClick={() => setShowWin(false)}
        >
          <div
            className="stamp"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="stamp-kicker">{demo ? "Demonstration" : "Balanced"}</p>
            <h2 id="win-title">
              {demo ? "Solution replay" : "The press is even"}
            </h2>
            <p>
              {demo
                ? game.level.parExact
                  ? "Optimal solution replay."
                  : "A procedural upper-bound solution, not necessarily optimal."
                : "Every node has |balance factor| ≤ 1."}
            </p>
            <p className="par-line">{parLabel(game.level)}</p>
            <div className="stars" aria-label={`${earnedStars} stars`}>
              {[1, 2, 3].map((i) => (
                <i key={i} className={i <= earnedStars ? "star on" : "star"} />
              ))}
            </div>
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
            <div className="row buttons stamp-actions">
              <button type="button" className="accent" onClick={() => setShowWin(false)}>
                View tree
              </button>
              {props.variant === "campaign" && props.hasNextLevel && (
                <button type="button" onClick={props.onNextLevel}>
                  Next level
                </button>
              )}
              {props.variant === "free" ? (
                <button type="button" onClick={() => scrambleNew()}>
                  New scramble
                </button>
              ) : (
                <button type="button" onClick={props.onExit}>
                  Back to map
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
