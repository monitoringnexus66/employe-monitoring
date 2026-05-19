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
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await prisma.device.update({
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

    return NextResponse.json({ success: true, activityId: activity.id }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
