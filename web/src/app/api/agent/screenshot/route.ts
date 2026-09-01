import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadScreenshotToR2 } from '@/lib/r2';

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
    const { deviceId, tenantId, s3Url, activityLevel } = body;

    if (!deviceId || !tenantId || !s3Url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    await prisma.device.updateMany({
      where: { id: deviceId },
      data: { lastPing: new Date() }
    });

    // If Cloudflare R2 is configured, offload image binary to R2 and store the small URL in Postgres
    let finalImageUrl = s3Url;
    if (s3Url.startsWith('data:image')) {
      const r2Url = await uploadScreenshotToR2(s3Url, tenantId, deviceId);
      if (r2Url) {
        finalImageUrl = r2Url;
      }
    }

    const screenshot = await prisma.screenshot.create({
      data: {
        deviceId,
        tenantId,
        s3Url: finalImageUrl,
        activityLevel: activityLevel || 0,
      },
    });

    return NextResponse.json({ success: true, screenshotId: screenshot.id, isR2: !finalImageUrl.startsWith('data:') }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('Screenshot log error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
