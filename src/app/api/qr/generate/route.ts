import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customSessionId = searchParams.get('sessionId');

    const now = Date.now();
    const sessionId = customSessionId || 'ses-' + new Date().toISOString().split('T')[0];

    const payload = {
      timestamp: now,
      sessionId,
      nonce: crypto.randomBytes(4).toString('hex'),
    };

    const token = JSON.stringify(payload);

    return NextResponse.json({
      success: true,
      token,
      payload,
      expiresInMs: 10000, // 10 seconds validity
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Gagal membuat dynamic QR token.' },
      { status: 500 }
    );
  }
}
