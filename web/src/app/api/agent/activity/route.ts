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
    const { deviceId, tenantId, appName, windowTitle, durationSeconds, isIdle } = body;

    if (!deviceId || !tenantId || !appName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    await prisma.device.updateMany({
      where: { id: deviceId },
      data: { lastPing: new Date() }
    });

    const activity = await prisma.activityLog.create({
      data: {
        deviceId,
        tenantId,
        appName,
        windowTitle: windowTitle || '',
        durationSeconds: durationSeconds || 0,
        isIdle: isIdle || false,
      },
    });

    // Check for updated settings to push back to agent
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { userId: true }
    });
    
    let screenshotInterval;
    if (device) {
       const membership = await prisma.tenantMembership.findUnique({
         where: { userId_tenantId: { userId: device.userId, tenantId } }
       });
       if (membership) {
         screenshotInterval = membership.screenshotInterval;
       }
    }

    // Check if an admin is currently viewing the Live CCTV page (heartbeat within 45s)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { lastLiveViewerPing: true }
    });

    const isCctvRequested = tenant?.lastLiveViewerPing 
      ? (Date.now() - new Date(tenant.lastLiveViewerPing).getTime() < 45000)
      : false;

    return NextResponse.json({ 
      success: true, 
      activityId: activity.id,
      screenshotInterval,
      isCctvRequested
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
