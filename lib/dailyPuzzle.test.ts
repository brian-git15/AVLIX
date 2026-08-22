import { describe, expect, it } from "vitest";
import { applyMove } from "./rotations";
import { cloneTree, isBalanced, structureOf } from "./tree";
import {
  DAILY_N_MAX,
  DAILY_N_MIN,
  dailyLevel,
  dailyPayload,
  isUtcDateKey,
  previousUtcDateKey,
  utcDateKey,
} from "./dailyPuzzle";
import { recordDailyComplete } from "./dailyProgress";
import { GET } from "../app/api/daily/route";

describe("dailyPuzzle", () => {
  it("accepts UTC date keys", () => {
    expect(isUtcDateKey("2026-08-22")).toBe(true);
    expect(isUtcDateKey("2026-02-29")).toBe(false);
    expect(isUtcDateKey("08-22-2026")).toBe(false);
  });

  it("same date yields the same n and tree", () => {
    const a = dailyLevel("2026-01-15");
    const b = dailyLevel("2026-01-15");
    expect(a.n).toBe(b.n);
    expect(structureOf(a.scrambledTree)).toEqual(structureOf(b.scrambledTree));
    expect(a.parRotations).toBe(b.parRotations);
    expect(a.optimalPath).toEqual(b.optimalPath);
  });

  it("scrambles n within the exact-par window", () => {
    const sizes = new Set<number>();
    for (const date of [
      "2026-01-01",
      "2026-03-12",
      "2026-06-08",
      "2026-09-21",
      "2026-11-04",
      "2026-12-25",
    ]) {
      const n = dailyLevel(date).n;
      expect(n).toBeGreaterThanOrEqual(DAILY_N_MIN);
      expect(n).toBeLessThanOrEqual(DAILY_N_MAX);
      sizes.add(n);
    }
    expect(sizes.size).toBeGreaterThan(1);
  });

  it("is unbalanced with exact optimal par", () => {
    const level = dailyLevel("2026-04-02");
    expect(isBalanced(level.scrambledTree)).toBe(false);
    expect(level.parExact).toBe(true);
    expect(level.parRotations).toBeGreaterThan(0);
    let live = cloneTree(level.scrambledTree)!;
    for (const move of level.optimalPath ?? []) {
      live = applyMove(live, move);
    }
    expect(isBalanced(live)).toBe(true);
  });

  it("payload round-trips", () => {
    const payload = dailyPayload("2026-05-05");
    expect(payload.date).toBe("2026-05-05");
    expect(payload.parExact).toBe(true);
  });
});

describe("dailyProgress", () => {
  it("starts a streak and continues across consecutive UTC days", () => {
    const first = recordDailyComplete(
      { record: null, streak: 0, lastSolvedDate: null },
      "2026-01-02",
      3,
      4,
      1200,
    );
    expect(first.streak).toBe(1);
    const next = recordDailyComplete(first, "2026-01-03", 2, 5, 900);
    expect(next.streak).toBe(2);
    expect(previousUtcDateKey("2026-01-03")).toBe("2026-01-02");
  });

  it("does not inflate streak on a second solve the same day", () => {
    const first = recordDailyComplete(
      { record: null, streak: 0, lastSolvedDate: null },
      "2026-01-02",
      1,
      8,
      4000,
    );
    const again = recordDailyComplete(first, "2026-01-02", 3, 3, 800);
    expect(again.streak).toBe(1);
    expect(again.record?.stars).toBe(3);
  });
});

describe("GET /api/daily", () => {
  it("returns cache headers and a puzzle for a UTC date", async () => {
    const res = GET(
      new Request("http://localhost/api/daily?date=2026-01-15"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=86400");
    const body = (await res.json()) as { date: string; parExact: boolean; n: number };
    expect(body.date).toBe("2026-01-15");
    expect(body.parExact).toBe(true);
    expect(body.n).toBeGreaterThanOrEqual(DAILY_N_MIN);
  });

  it("rejects invalid dates", async () => {
    const res = GET(new Request("http://localhost/api/daily?date=nope"));
    expect(res.status).toBe(400);
  });

  it("defaults to UTC today", async () => {
    const res = GET(new Request("http://localhost/api/daily"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { date: string };
    expect(body.date).toBe(utcDateKey());
  });
});
