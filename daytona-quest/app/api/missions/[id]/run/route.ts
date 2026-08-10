import { NextRequest, NextResponse } from "next/server";
import { executeMission } from "@/lib/missions";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const result = await executeMission(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[mission-run]", error);
    return NextResponse.json(
      {
        missionId: id,
        success: false,
        xpEarned: 0,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    );
  }
}
