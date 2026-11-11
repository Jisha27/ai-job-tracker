import { analyzeMatch } from "@/lib/ai";
import { AnalyzeRequestSchema } from "@/lib/schema";

export async function POST(request: Request) {
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
