import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "global" }
    });
    
    return NextResponse.json(settings || {});
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

    const updated = await prisma.systemSettings.upsert({
      where: { id: "global" },
      update: updateData,
      create: {
        id: "global",
        appName: "CHIIO OS",
        ...updateData
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error saving system settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
