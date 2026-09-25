import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getScreenshotStorageStats } from "@/lib/screenshot-cleanup";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [settings, stats] = await Promise.all([
      prisma.systemSettings.findUnique({
        where: { id: "global" }
      }),
      getScreenshotStorageStats()
    ]);
    
    return NextResponse.json({
      settings: settings || {
        id: "global",
        appName: "CHIIO OS",
        autoDeleteScreenshots: true,
        screenshotRetentionDays: 30,
        lastDeletedCount: 0,
      },
      stats
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    
    const updateData: any = {};
    if (body.deepseekApiKey !== undefined) updateData.deepseekApiKey = body.deepseekApiKey;
    if (body.autoDeleteScreenshots !== undefined) updateData.autoDeleteScreenshots = Boolean(body.autoDeleteScreenshots);
    if (body.screenshotRetentionDays !== undefined) updateData.screenshotRetentionDays = parseInt(body.screenshotRetentionDays, 10);

    const updated = await prisma.systemSettings.upsert({
      where: { id: "global" },
      update: updateData,
      create: {
        id: "global",
        appName: "CHIIO OS",
        autoDeleteScreenshots: true,
        screenshotRetentionDays: 30,
        ...updateData
      }
    });

    const stats = await getScreenshotStorageStats();

    return NextResponse.json({ settings: updated, stats });
  } catch (error) {
    console.error("Error saving system settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
