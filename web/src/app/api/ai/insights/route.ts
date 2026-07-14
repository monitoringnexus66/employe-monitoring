import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN" || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured." }, { status: 500 });
    }

    const { userId, date } = await req.json();

    if (!userId || !date) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get the device for this user
    const device = await prisma.device.findFirst({
      where: { userId }
    });

    if (!device) {
      return NextResponse.json({ error: "No device found for this user." }, { status: 400 });
    }

    const logs = await prisma.activityLog.findMany({
      where: {
        tenantId: session.tenantId,
        deviceId: device.id,
        timestamp: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (logs.length === 0) {
      return NextResponse.json({ insight: "No activity data available for this day to analyze." });
    }

    // Compress logs to save tokens
    const appUsage: Record<string, number> = {};
    logs.forEach(log => {
      if (!appUsage[log.appName]) appUsage[log.appName] = 0;
      appUsage[log.appName] += log.durationSeconds;
    });

    let summaryText = "Application Usage Summary (in seconds):\n";
    for (const [app, duration] of Object.entries(appUsage)) {
      summaryText += `- ${app}: ${duration}s\n`;
    }

    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey
    });

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are an expert HR and Productivity analyst. You will be provided with an employee's application usage summary for a single day. Analyze their focus, identify potential distractions, and write a concise, professional 2-3 paragraph performance insight in Markdown format. Be encouraging but objective." 
        },
        { role: "user", content: summaryText }
      ],
      model: "deepseek-chat",
    });

    return NextResponse.json({ insight: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error generating AI insight:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
