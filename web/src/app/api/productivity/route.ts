import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const categories = await prisma.appCategory.findMany({
      where: { tenantId: session.tenantId },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching app categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN" || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { appName, category } = await req.json();

    if (!appName || !["PRODUCTIVE", "UNPRODUCTIVE", "NEUTRAL"].includes(category)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const appCategory = await prisma.appCategory.upsert({
      where: {
        tenantId_appName: {
          tenantId: session.tenantId,
          appName,
        },
      },
      update: {
        category,
      },
      create: {
        tenantId: session.tenantId,
        appName,
        category,
      },
    });

    return NextResponse.json(appCategory);
  } catch (error) {
    console.error("Error setting app category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
