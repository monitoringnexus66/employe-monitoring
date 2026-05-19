import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    await prisma.device.update({
      where: { id: deviceId },
      data: { lastPing: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ping error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
