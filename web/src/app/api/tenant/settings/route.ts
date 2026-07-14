import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        package: true,
        _count: {
          select: { memberships: true },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Whitelist allowed fields for update
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.primaryContactName !== undefined) updateData.primaryContactName = body.primaryContactName;
    if (body.primaryContactEmail !== undefined) updateData.primaryContactEmail = body.primaryContactEmail;
    if (body.primaryContactPhone !== undefined) updateData.primaryContactPhone = body.primaryContactPhone;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.defaultScreenshotInterval !== undefined) updateData.defaultScreenshotInterval = body.defaultScreenshotInterval;
    if (body.idleTimeout !== undefined) updateData.idleTimeout = body.idleTimeout;
    if (body.blurScreenshots !== undefined) updateData.blurScreenshots = body.blurScreenshots;
    if (body.logoBase64 !== undefined) updateData.logoBase64 = body.logoBase64;

    const updatedTenant = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: updateData,
    });

    return NextResponse.json({ tenant: updatedTenant });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
