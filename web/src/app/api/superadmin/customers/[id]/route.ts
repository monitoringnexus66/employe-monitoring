import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tenantId = params.id;
    const body = await req.json();

    const {
      customerId,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      packageId,
      subscriptionStatus,
      renewalDate
    } = body;

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        customerId: customerId || null,
        primaryContactName: primaryContactName || null,
        primaryContactEmail: primaryContactEmail || null,
        primaryContactPhone: primaryContactPhone || null,
        packageId: packageId || null,
        subscriptionStatus: subscriptionStatus || "active",
        renewalDate: renewalDate || null
      }
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
