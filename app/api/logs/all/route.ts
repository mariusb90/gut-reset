import { NextRequest, NextResponse } from 'next/server';

const PB_URL = 'http://127.0.0.1:8090';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'local-user';
  
  try {
    const filter = encodeURIComponent(`user="${userId}"`);
    const res = await fetch(`${PB_URL}/api/collections/daily_logs/records?filter=${filter}&sort=log_date&perPage=50`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(data.items || []);
  } catch {
    return NextResponse.json([]);
  }
}
