import { dailyPayload, isUtcDateKey, utcDateKey } from "@/lib/dailyPuzzle";

export const maxDuration = 10;

/** First human or the 00:00 UTC cron (vercel.json) pays BFS; CDN serves the rest. */
export function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("date") ?? utcDateKey();
  if (!isUtcDateKey(requested)) {
    return Response.json(
      { error: "date must be YYYY-MM-DD (UTC)" },
      { status: 400 },
    );
  }

  const payload = dailyPayload(requested);
  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
