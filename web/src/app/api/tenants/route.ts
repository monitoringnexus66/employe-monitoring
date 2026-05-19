import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, adminEmail, adminPassword } = await request.json();
    
    // Create the company
    const tenant = await prisma.tenant.create({ data: { name } });
    
    // Check if the admin user already exists globally
    let user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
       user = await prisma.user.create({
         data: { name: "Tenant Admin", email: adminEmail, passwordHash: adminPassword }
       });
    }
    
    // Bind the user to the company as an ADMIN
    await prisma.tenantMembership.create({
       data: { userId: user.id, tenantId: tenant.id, role: "ADMIN" }
    });

    return NextResponse.json({ success: true, tenant, user });
  } catch (e: any) {
    console.error("Create tenant error", e);
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}
