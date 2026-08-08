import { NextRequest, NextResponse } from "next/server";
import { buildNewspaper } from "@/lib/github";
import type { TimeRange } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseRange(value: string | null): TimeRange {
  return value === "weekly" ? "weekly" : "daily";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const range = parseRange(searchParams.get("range"));
    const language = searchParams.get("language") || null;

    const payload = await buildNewspaper(range, language);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[api/repos]", error);
    return NextResponse.json(
      { error: "Failed to fetch newspaper data." },
      { status: 500 },
    );
  }
}
