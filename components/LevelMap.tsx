"use client";

import { CAMPAIGN_LEVELS } from "@/lib/campaignLevels";
import {
  isLevelUnlocked,
  type CampaignProgress,
} from "@/lib/campaignProgress";

type Props = {
  progress: CampaignProgress;
  onSelect: (levelId: string) => void;
  onBack: () => void;
  onTutorial: () => void;
};

function difficultyLabel(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function LevelMap({ progress, onSelect, onBack, onTutorial }: Props) {
  return (
    <div className="press">
      <header className="masthead">
        <p className="kicker">Campaign — curated folio</p>
        <h1>Level Map</h1>
        <p className="lede">
          {CAMPAIGN_LEVELS.length} hand-set puzzles with exact optimal par.
          Progress and stars persist in this browser.
        </p>
      </header>

      <ol className="level-map">
        {CAMPAIGN_LEVELS.map((level, index) => {
          const unlocked = isLevelUnlocked(index, progress);
          const stars = progress.stars[level.id] ?? 0;
          return (
            <li key={level.id}>
              <button
                type="button"
                className={`level-node${unlocked ? "" : " is-locked"}`}
                disabled={!unlocked}
                onClick={() => onSelect(level.id)}
              >
                <span className="level-index">{index + 1}</span>
                <span className="level-copy">
                  <strong>{level.title ?? `Level ${index + 1}`}</strong>
                  <small>{level.blurb ?? ""}</small>
                  <span className="level-meta">
                    {difficultyLabel(level.difficulty)} · optimal{" "}
                    {level.parRotations}
                  </span>
                </span>
                <span className="level-stars" aria-label={`${stars} stars earned`}>
                  {[1, 2, 3].map((i) => (
                    <i
                      key={i}
                      className={i <= stars ? "star on" : "star"}
                    />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="row buttons map-actions">
        <button type="button" onClick={onTutorial}>
          Tutorial
        </button>
        <button type="button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
