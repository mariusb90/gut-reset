import { NextResponse } from 'next/server';

const PB_URL = 'http://127.0.0.1:8090';

export async function GET() {
  try {
    const res = await fetch(`${PB_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false }, { status: 503 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
