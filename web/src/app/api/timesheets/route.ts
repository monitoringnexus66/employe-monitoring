import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN" || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const dateStr = searchParams.get('date');

    if (!userId || !dateStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get the device for this user
    const device = await prisma.device.findFirst({
      where: { userId }
    });

    if (!device) {
      return NextResponse.json([]); // No device, no logs
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

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching timesheet logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
