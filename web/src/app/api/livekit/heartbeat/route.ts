import { NextResponse } from 'next/server';

// Global presence tracker in serverless / edge runtime
declare global {
  var __activeLiveKitViewers: Record<string, number> | undefined;
}

if (!global.__activeLiveKitViewers) {
  global.__activeLiveKitViewers = {};
}

export function markTenantViewing(tenantId: string) {
  if (!global.__activeLiveKitViewers) {
    global.__activeLiveKitViewers = {};
  }
  global.__activeLiveKitViewers[tenantId] = Date.now();
}

export function isCctvActiveForTenant(tenantId: string): boolean {
  if (!global.__activeLiveKitViewers) return false;
  const lastPing = global.__activeLiveKitViewers[tenantId];
  if (!lastPing) return false;
  // Active if pinged in the last 30 seconds
  return Date.now() - lastPing < 30000;
}

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

    markTenantViewing(tenantId);

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
