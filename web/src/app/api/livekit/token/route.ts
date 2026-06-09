import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    
    const url = new URL(req.url);
    const room = url.searchParams.get('room');
    const isAgent = url.searchParams.get('isAgent') === 'true';

    if (!room) {
      return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400, headers: corsHeaders });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500, headers: corsHeaders });
    }

    const identity = isAgent ? `agent-${Math.random().toString(36).substring(7)}` : `admin-${session?.id || Math.random().toString(36).substring(7)}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: isAgent,
      canSubscribe: !isAgent,
    });

    return NextResponse.json({ token: await at.toJwt(), url: wsUrl }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
