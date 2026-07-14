import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "global" }
    });
    
    if (!settings) {
      return NextResponse.json({ appName: "NexusTrack", logoBase64: null });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching branding:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { appName, logoBase64 } = await req.json();

    const updated = await prisma.systemSettings.upsert({
      where: { id: "global" },
      update: {
        appName: appName || "NexusTrack",
        logoBase64: logoBase64 !== undefined ? logoBase64 : undefined,
      },
      create: {
        id: "global",
        appName: appName || "NexusTrack",
        logoBase64: logoBase64 || null,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error saving branding:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
