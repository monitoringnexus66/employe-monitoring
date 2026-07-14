import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    let { email, password } = await request.json();
    email = email?.trim().toLowerCase();
    password = password?.trim();
    
    // Auto-seed: If this is the very first login and no SUPERADMIN exists,
    // we intercept 'admin@nexus.com' and create the global superadmin account.
    const superAdminCount = await prisma.user.count({ where: { isSuperAdmin: true } });
    if (superAdminCount === 0 && email === "admin@nexus.com" && password === "admin") {
      const sysTenant = await prisma.tenant.upsert({
        where: { id: "system" },
        update: {},
        create: { id: "system", name: "Nexus System" }
      });
      await prisma.user.create({
        data: {
          email: "admin@nexus.com",
          passwordHash: "admin",
          name: "System Admin",
          isSuperAdmin: true,
          memberships: {
             create: { tenantId: sysTenant.id, role: "ADMIN" }
          }
        }
      });
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { memberships: true }
    });

    if (!user || user.passwordHash !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Set secure cookie with the default first workspace
    const firstTenantId = user.memberships[0]?.tenantId || "system";
    const token = signToken({ userId: user.id, activeTenantId: firstTenantId });
    
    const cookieStore = await cookies();
    cookieStore.set('nexus_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return NextResponse.json({ success: true, redirect: "/dashboard" });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
