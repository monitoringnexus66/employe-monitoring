import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    if (id === "system") return NextResponse.json({ error: "Cannot delete system tenant" }, { status: 400 });

    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    if (id === "system") return NextResponse.json({ error: "Cannot edit system tenant" }, { status: 400 });

    const { name, subscriptionStatus } = await request.json();
    const tenant = await prisma.tenant.update({
      where: { id },
      data: { name, subscriptionStatus }
    });
    
    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}
