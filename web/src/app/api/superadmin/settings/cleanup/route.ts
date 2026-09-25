import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runScreenshotCleanup, getScreenshotStorageStats } from "@/lib/screenshot-cleanup";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let customDays: number | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.days === "number") {
        customDays = body.days;
      }
    } catch {
      // Body is optional
    }

    const result = await runScreenshotCleanup(customDays);
    const stats = await getScreenshotStorageStats();

    return NextResponse.json({
      success: true,
      result,
      stats,
      message: `Cleaned up ${result.deletedCount} expired screenshot(s).`,
    });
  } catch (error) {
    console.error("Error during manual screenshot cleanup:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
