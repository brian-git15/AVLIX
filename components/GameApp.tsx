"use client";

import { useEffect, useState } from "react";
import { LevelMap } from "@/components/LevelMap";
import { PuzzleSession } from "@/components/PuzzleSession";
import { Tutorial } from "@/components/Tutorial";
import {
  loadCampaignProgress,
  recordLevelComplete,
  saveCampaignProgress,
  type CampaignProgress,
} from "@/lib/campaignProgress";
import {
  CAMPAIGN_LEVELS,
  getCampaignLevel,
  getCampaignLevelIndex,
} from "@/lib/campaignLevels";
import { createGameFromLevel, newGame } from "@/lib/gameState";
import {
  levelFromDailyPayload,
  utcDateKey,
  type DailyPayload,
} from "@/lib/dailyPuzzle";
import {
  loadDailyProgress,
  recordDailyComplete,
  saveDailyProgress,
  todayDailyStars,
  type DailyProgress,
} from "@/lib/dailyProgress";

type Screen = "home" | "tutorial" | "free" | "map" | "campaign" | "daily";

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("daily");
  const [campaignLevelId, setCampaignLevelId] = useState<string | null>(null);
  const [progress, setProgress] = useState<CampaignProgress | null>(() =>
    loadCampaignProgress(),
  );
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(
    () => loadDailyProgress(),
  );
  const [dailyPayload, setDailyPayload] = useState<DailyPayload | null>(null);
  const [dailyError, setDailyError] = useState<string | null>(null);

  useEffect(() => {
    setProgress(loadCampaignProgress());
    setDailyProgress(loadDailyProgress());
  }, []);

  function updateProgress(next: CampaignProgress) {
    setProgress(next);
    saveCampaignProgress(next);
  }

  function updateDaily(next: DailyProgress) {
    setDailyProgress(next);
    saveDailyProgress(next);
  }

  const today = utcDateKey();
  const dailyStars = dailyProgress ? todayDailyStars(dailyProgress, today) : 0;

  if (screen === "home") {
    return (
      <div className="press">
        <header className="masthead masthead-home">
          <div className="masthead-copy">
            <p className="kicker">Workshop No. 1 — tree shapes only</p>
            <h1>AVLIX</h1>
            <p className="lede">
              A Rubik’s cube for binary trees. In-order stays sorted; only shape
              changes. Pick a mode to begin.
            </p>
          </div>
          <aside className="maker-plate" aria-label="About the maker">
            <img
              className="maker-portrait"
              src="/brian-su.png"
              alt="Brian Su"
              width={52}
              height={52}
            />
            <div className="maker-copy">
              <strong>Brian Su</strong>
              <p className="maker-links">
                <a
                  href="https://brian-su-website.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Website
                </a>
                <a
                  href="https://www.linkedin.com/in/briansu33/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </p>
            </div>
          </aside>
        </header>

        <div className="mode-grid">
          <button
            type="button"
            className="mode-card accent"
            onClick={() => {
              setDailyPayload(null);
              setDailyError(null);
              setScreen("daily");
            }}
          >
            <span className="mode-kicker">UTC midnight</span>
            <strong>Daily</strong>
            <small>
              One worldwide puzzle for {today}. Exact optimal par. New sheet at
              00:00 UTC.
              {dailyProgress && dailyProgress.streak > 0
                ? ` Streak ${dailyProgress.streak}.`
                : ""}
            </small>
            {dailyStars > 0 && (
              <span className="mode-stars" aria-label={`${dailyStars} stars today`}>
                {[1, 2, 3].map((i) => (
                  <i
                    key={i}
                    className={i <= dailyStars ? "star on" : "star"}
                  />
                ))}
              </span>
            )}
          </button>
          <button
            type="button"
            className="mode-card accent"
            onClick={() => setScreen("tutorial")}
          >
            <span className="mode-kicker">New here?</span>
            <strong>Tutorial</strong>
            <small>
              Learn balance factors, left/right rotations, and Z · C · G roles
              before the campaign.
            </small>
          </button>
          <button
            type="button"
            className="mode-card accent"
            onClick={() => setScreen("map")}
          >
            <span className="mode-kicker">Curated</span>
            <strong>Campaign</strong>
            <small>
              {CAMPAIGN_LEVELS.length} fixed levels on a map. Exact optimal par
              and saved stars.
            </small>
          </button>
          <button
            type="button"
            className="mode-card"
            onClick={() => setScreen("free")}
          >
            <span className="mode-kicker">Endless</span>
            <strong>Free Play</strong>
            <small>
              Random scrambles — choose size and shuffle style yourself.
            </small>
          </button>
        </div>
      </div>
    );
  }

  if (screen === "tutorial") {
    return (
      <Tutorial
        onDone={() => setScreen("home")}
        onStartCampaign={() => setScreen("map")}
      />
    );
  }

  if (screen === "map" && progress) {
    return (
      <LevelMap
        progress={progress}
        onBack={() => setScreen("home")}
        onTutorial={() => setScreen("tutorial")}
        onSelect={(id) => {
          setCampaignLevelId(id);
          setScreen("campaign");
        }}
      />
    );
  }

  if (screen === "free") {
    return (
      <PuzzleSession
        key="free"
        variant="free"
        initialGame={newGame(7, "random-shape")}
        onExit={() => setScreen("home")}
        onNewScramble={(size, mode, depth) => newGame(size, mode, depth)}
      />
    );
  }

  if (screen === "daily") {
    return (
      <DailyGate
        payload={dailyPayload}
        error={dailyError}
        onReady={setDailyPayload}
        onError={setDailyError}
        onExit={() => setScreen("home")}
        onComplete={(stars, moves, time) => {
          if (!dailyPayload) return;
          updateDaily(
            recordDailyComplete(
              dailyProgress ?? loadDailyProgress(),
              dailyPayload.date,
              stars,
              moves,
              time,
            ),
          );
        }}
      />
    );
  }

  if (screen === "campaign" && campaignLevelId && progress) {
    const level = getCampaignLevel(campaignLevelId);
    if (!level) {
      setScreen("map");
      return null;
    }
    const index = getCampaignLevelIndex(campaignLevelId);
    const nextLevel = CAMPAIGN_LEVELS[index + 1];

    return (
      <PuzzleSession
        key={campaignLevelId}
        variant="campaign"
        initialGame={createGameFromLevel(level)}
        levelTitle={level.title ?? `Level ${index + 1}`}
        levelNumber={index + 1}
        onExit={() => setScreen("map")}
        hasNextLevel={index >= 0 && index < CAMPAIGN_LEVELS.length - 1}
        onNextLevel={() => {
          if (nextLevel) {
            setCampaignLevelId(nextLevel.id);
          }
        }}
        onComplete={(stars) => {
          updateProgress(recordLevelComplete(progress, campaignLevelId, stars));
        }}
      />
    );
  }

  return (
    <div className="press">
      <header className="masthead">
        <p className="kicker">Workshop No. 1</p>
        <h1>AVLIX</h1>
        <p className="lede">Setting the type…</p>
      </header>
    </div>
  );
}

function DailyGate({
  payload,
  error,
  onReady,
  onError,
  onExit,
  onComplete,
}: {
  payload: DailyPayload | null;
  error: string | null;
  onReady: (payload: DailyPayload) => void;
  onError: (message: string) => void;
  onExit: () => void;
  onComplete: (stars: 0 | 1 | 2 | 3, moves: number, time: number) => void;
}) {
  useEffect(() => {
    if (payload || error) return;
    let cancelled = false;
    fetch("/api/daily")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? `Daily failed (${res.status})`);
        }
        return res.json() as Promise<DailyPayload>;
      })
      .then((data) => {
        if (!cancelled) onReady(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          onError(err instanceof Error ? err.message : "Daily failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payload, error, onReady, onError]);

  if (error) {
    return (
      <div className="press">
        <header className="masthead">
          <p className="kicker">Daily</p>
          <h1>AVLIX</h1>
          <p className="lede">{error}</p>
        </header>
        <div className="row buttons">
          <button type="button" onClick={onExit}>
            Menu
          </button>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="press">
        <header className="masthead">
          <p className="kicker">Daily</p>
          <h1>AVLIX</h1>
          <p className="lede">Setting today’s type…</p>
        </header>
      </div>
    );
  }

  const level = levelFromDailyPayload(payload);
  return (
    <PuzzleSession
      key={payload.date}
      variant="daily"
      date={payload.date}
      initialGame={createGameFromLevel(level)}
      onExit={onExit}
      onComplete={onComplete}
    />
  );
}
