import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { membershipId, screenshotInterval } = await request.json();

    // Verify the admin has access to this membership
    const membership = await prisma.tenantMembership.findUnique({
      where: { id: membershipId }
    });

    if (!membership || membership.tenantId !== session.tenantId) {
      return NextResponse.json({ error: "Unauthorized access to this membership." }, { status: 403 });
    }

    await prisma.tenantMembership.update({
      where: { id: membershipId },
      data: { screenshotInterval }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
