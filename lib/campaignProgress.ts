import { CAMPAIGN_LEVELS } from "./campaignLevels";

const STORAGE_KEY = "avlix-campaign-v1";

export interface CampaignProgress {
  /** Highest level index unlocked (0-based, inclusive). */
  unlockedThrough: number;
  stars: Record<string, 0 | 1 | 2 | 3>;
}

function defaultProgress(): CampaignProgress {
  return { unlockedThrough: 0, stars: {} };
}

export function loadCampaignProgress(): CampaignProgress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as CampaignProgress;
    return {
      unlockedThrough: Math.min(
        Math.max(0, parsed.unlockedThrough ?? 0),
        CAMPAIGN_LEVELS.length - 1,
      ),
      stars: parsed.stars ?? {},
    };
  } catch {
    return defaultProgress();
  }
}

export function saveCampaignProgress(progress: CampaignProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function isLevelUnlocked(index: number, progress: CampaignProgress): boolean {
  return index <= progress.unlockedThrough;
}

export function recordLevelComplete(
  progress: CampaignProgress,
  levelId: string,
  stars: 0 | 1 | 2 | 3,
): CampaignProgress {
  const index = CAMPAIGN_LEVELS.findIndex((level) => level.id === levelId);
  if (index < 0) return progress;
  const prev = progress.stars[levelId] ?? 0;
  const nextStars = Math.max(prev, stars) as 0 | 1 | 2 | 3;
  const unlockedThrough = Math.max(
    progress.unlockedThrough,
    Math.min(index + 1, CAMPAIGN_LEVELS.length - 1),
  );
  return {
    unlockedThrough,
    stars: { ...progress.stars, [levelId]: nextStars },
  };
}
