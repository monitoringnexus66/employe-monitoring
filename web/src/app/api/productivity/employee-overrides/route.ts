import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ProductivityCategory } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN" || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const overrides = await prisma.employeeAppCategory.findMany({
      where: {
        userId,
        tenantId: session.tenantId
      }
    });

    return NextResponse.json(overrides);
  } catch (error) {
    console.error("Error fetching overrides:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN" || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, appName, category } = await req.json();

    if (!userId || !appName || !category) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const updated = await prisma.employeeAppCategory.upsert({
      where: {
        userId_tenantId_appName: {
          userId,
          tenantId: session.tenantId,
          appName
        }
      },
      update: {
        category: category as ProductivityCategory
      },
      create: {
        userId,
        tenantId: session.tenantId,
        appName,
        category: category as ProductivityCategory
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error saving employee override:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
