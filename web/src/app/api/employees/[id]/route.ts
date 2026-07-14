import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: userId } = await params;
    const tenantId = session.tenantId;

    // First check if the membership exists
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Employee not found in your organization" }, { status: 404 });
    }

    // Optional: Do not let admin delete themselves unless they are doing something specific,
    // but typically we can just block it.
    if (userId === session.userId) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    // Delete the membership. This removes them from the company.
    // In a multi-tenant system, this is better than deleting the entire user account.
    await prisma.tenantMembership.delete({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
