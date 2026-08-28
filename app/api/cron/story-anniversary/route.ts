import { NextResponse } from "next/server";
import { unauthorizedCronResponse } from "@/lib/ops/cron-auth";
import { runStoryAnniversaryCron } from "@/lib/ops/story-anniversary";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = unauthorizedCronResponse(req);
  if (denied) return denied;

  try {
    const result = await runStoryAnniversaryCron();
    return NextResponse.json(result);
  } catch (e) {
    console.error("[cron/story-anniversary]", e);
    return NextResponse.json({ error: "story_anniversary_failed" }, { status: 500 });
  }
}
