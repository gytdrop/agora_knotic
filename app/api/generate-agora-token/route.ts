import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { handleCorsPreflight, withCors } from '@/lib/cors';

const EXPIRATION_TIME_IN_SECONDS = 3600;
const DEFAULT_CHANNEL_NAME = 'incident-8921';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

function createAgoraToken(channel: string, uidStr?: string | null) {
  const APP_ID = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const APP_CERTIFICATE =
    process.env.AGORA_APP_CERTIFICATE || process.env.NEXT_AGORA_APP_CERTIFICATE;

  if (!APP_ID || !APP_CERTIFICATE) {
    return {
      error:
        'Agora credentials are not set. Set AGORA_APP_ID/NEXT_PUBLIC_AGORA_APP_ID and AGORA_APP_CERTIFICATE/NEXT_AGORA_APP_CERTIFICATE.',
      status: 500,
    };
  }

  const parsedUid = uidStr ? parseInt(uidStr, 10) : Number.NaN;
  const uid =
    Number.isNaN(parsedUid) || parsedUid <= 0
      ? Math.floor(Math.random() * 9_999_000) + 1000
      : parsedUid;

  const channelName = channel.trim() || DEFAULT_CHANNEL_NAME;

  const expirationTime =
    Math.floor(Date.now() / 1000) + EXPIRATION_TIME_IN_SECONDS;

  const token = RtcTokenBuilder.buildTokenWithRtm(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid.toString(),
    RtcRole.PUBLISHER,
    expirationTime,
    expirationTime,
  );

  return {
    token,
    uid: uid.toString(),
    channel: channelName,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uidStr = searchParams.get('uid');
  const channelName = searchParams.get('channel') || DEFAULT_CHANNEL_NAME;

  try {
    const result = createAgoraToken(channelName, uidStr);
    if ('error' in result) {
      return withCors(
        NextResponse.json({ error: result.error }, { status: result.status }),
        request,
      );
    }

    return withCors(NextResponse.json(result), request);
  } catch (error) {
    console.error('Error generating Agora token (GET):', error);
    return withCors(
      NextResponse.json(
        {
          error: 'Failed to generate Agora token',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      ),
      request,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: { channelName?: string; channel?: string; uid?: string | number; userName?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty or invalid body fallback
    }

    const channelName = body.channelName || body.channel || DEFAULT_CHANNEL_NAME;
    const uidStr = body.uid ? String(body.uid) : null;

    const result = createAgoraToken(channelName, uidStr);
    if ('error' in result) {
      return withCors(
        NextResponse.json({ error: result.error }, { status: result.status }),
        request,
      );
    }

    return withCors(NextResponse.json(result), request);
  } catch (error) {
    console.error('Error generating Agora token (POST):', error);
    return withCors(
      NextResponse.json(
        {
          error: 'Failed to generate Agora token',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      ),
      request,
    );
  }
}
