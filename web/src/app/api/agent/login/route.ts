import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { email, password, machineId, osInfo = "macOS" } = body;
    email = email?.trim().toLowerCase();
    password = password?.trim();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { tenant: true } } }
    });

    if (!user || user.passwordHash !== password || user.memberships.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials or no workspaces.' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Register this device for the user securely
    const device = await prisma.device.upsert({
      where: { id: machineId },
      update: { lastPing: new Date(), userId: user.id, osInfo },
      create: { id: machineId, userId: user.id, osInfo },
    });

    return NextResponse.json({ 
      success: true, 
      workspaces: user.memberships.map((m: any) => ({
        id: m.tenantId,
        name: m.tenant.name,
        screenshotInterval: m.screenshotInterval
      })),
      deviceId: device.id, 
      userId: user.id,
      name: user.name 
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('Agent login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
