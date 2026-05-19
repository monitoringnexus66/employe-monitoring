import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password } = body;
    const tenantId = session.tenantId;

    // Check if the user already exists globally
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { name, email, passwordHash: password }
      });
    }

    // Create the membership binding them to this company
    try {
      await prisma.tenantMembership.create({
        data: { userId: user.id, tenantId, role: "EMPLOYEE" }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'This user is already an employee in this workspace.' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Failed to create employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
