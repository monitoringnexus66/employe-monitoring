import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    
    const url = new URL(req.url);
    const room = url.searchParams.get('room');
    const isAgent = url.searchParams.get('isAgent') === 'true';

    // If an admin is requesting it, ensure they are logged in.
    // If an agent is requesting it, it should pass a device token ideally.
    // For MVP, we use the room name which could be the tenantId.
    if (!room) {
      return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Identity is random for subscribers, or deviceId for agents.
    const identity = isAgent ? `agent-${Math.random().toString(36).substring(7)}` : `admin-${session?.user?.id || Math.random().toString(36).substring(7)}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: isAgent,
      canSubscribe: !isAgent,
    });

    return NextResponse.json({ token: await at.toJwt(), url: wsUrl });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
