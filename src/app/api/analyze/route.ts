import { analyzeMatch } from "@/lib/ai";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";
import { AnalyzeRequestSchema } from "@/lib/schema";

// 10 analyses per IP per hour. In-memory, so per server instance (see rateLimit.ts).
const RATE_LIMIT = 10;
const checkRateLimit = createRateLimiter({ limit: RATE_LIMIT, windowMs: 60 * 60 * 1000 });

export async function POST(request: Request) {
  // Checked before parsing so malformed requests also count toward the limit.
  const rate = checkRateLimit(getClientIp(request));
  if (!rate.allowed) {
    return Response.json(
      {
        error: `You've reached the limit of ${RATE_LIMIT} analyses per hour. Please try again later.`,
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid request.",
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  try {
    const result = await analyzeMatch(parsed.data);
    return Response.json(result);
  } catch (error) {
    // Log the real cause on the server only; the client gets a generic message.
    console.error("[api/analyze] analysis failed:", error);
    return Response.json(
      { error: "We couldn't analyze this match right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
