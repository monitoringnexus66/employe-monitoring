import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN" || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;
    const { jobDescription } = await req.json();

    const updated = await prisma.tenantMembership.update({
      where: {
        userId_tenantId: {
          userId: id,
          tenantId: session.tenantId
        }
      },
      data: { jobDescription }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating job description:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
