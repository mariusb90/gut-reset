import { NextRequest, NextResponse } from 'next/server';

const PB_URL = 'http://127.0.0.1:8090';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'local-user';
  
  try {
    const filter = encodeURIComponent(`user="${userId}"`);
    const res = await fetch(`${PB_URL}/api/collections/baselines/records?filter=${filter}&perPage=1`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return NextResponse.json(null);
    const data = await res.json();
    return NextResponse.json(data.items[0] || null);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  try {
    const filter = encodeURIComponent(`user="${body.user}"`);
    const checkRes = await fetch(`${PB_URL}/api/collections/baselines/records?filter=${filter}&perPage=1`, {
      signal: AbortSignal.timeout(3000),
    });
    
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing.items[0]) {
        const updateRes = await fetch(`${PB_URL}/api/collections/baselines/records/${existing.items[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(3000),
        });
        return NextResponse.json(await updateRes.json());
      }
    }
    
    const createRes = await fetch(`${PB_URL}/api/collections/baselines/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    return NextResponse.json(await createRes.json());
  } catch {
    return NextResponse.json({ error: 'PocketBase unavailable' }, { status: 503 });
  }
}
