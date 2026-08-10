import { NextResponse } from "next/server";
import { MISSIONS } from "@/lib/missions";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ missions: MISSIONS });
}
