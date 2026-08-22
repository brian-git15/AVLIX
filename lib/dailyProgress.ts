import { previousUtcDateKey, utcDateKey } from "./dailyPuzzle";

const STORAGE_KEY = "avlix-daily-v1";

export interface DailyRecord {
  date: string;
  stars: 0 | 1 | 2 | 3;
  moves: number;
  time: number;
}

export interface DailyProgress {
  record: DailyRecord | null;
  streak: number;
  lastSolvedDate: string | null;
}

function defaultProgress(): DailyProgress {
  return { record: null, streak: 0, lastSolvedDate: null };
}

export function loadDailyProgress(): DailyProgress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as DailyProgress;
    return {
      record: parsed.record ?? null,
      streak: Math.max(0, parsed.streak ?? 0),
      lastSolvedDate: parsed.lastSolvedDate ?? null,
    };
  } catch {
    return defaultProgress();
  }
}

export function saveDailyProgress(progress: DailyProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function todayDailyStars(
  progress: DailyProgress,
  date: string = utcDateKey(),
): 0 | 1 | 2 | 3 {
  if (progress.record?.date !== date) return 0;
  return progress.record.stars;
}

export function recordDailyComplete(
  progress: DailyProgress,
  date: string,
  stars: 0 | 1 | 2 | 3,
  moves: number,
  time: number,
): DailyProgress {
  const sameDay = progress.record?.date === date;
  const nextStars = sameDay
    ? (Math.max(progress.record!.stars, stars) as 0 | 1 | 2 | 3)
    : stars;
  const alreadySolvedToday = progress.lastSolvedDate === date;
  let streak = progress.streak;
  if (!alreadySolvedToday) {
    streak =
      progress.lastSolvedDate === previousUtcDateKey(date)
        ? progress.streak + 1
        : 1;
  }
  return {
    record: {
      date,
      stars: nextStars,
      moves: sameDay ? Math.min(progress.record!.moves, moves) : moves,
      time: sameDay ? Math.min(progress.record!.time, time) : time,
    },
    streak,
    lastSolvedDate: date,
  };
}
