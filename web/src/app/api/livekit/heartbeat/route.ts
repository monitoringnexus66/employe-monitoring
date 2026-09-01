import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Persist heartbeat directly into database so all serverless instances stay synchronized
    await prisma.tenant.updateMany({
      where: { id: tenantId },
      data: { lastLiveViewerPing: new Date() }
    });

    return NextResponse.json({
      success: true,
      active: true,
      timestamp: Date.now()
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
