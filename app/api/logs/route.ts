import { NextRequest, NextResponse } from 'next/server';

const PB_URL = 'http://127.0.0.1:8090';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const userId = searchParams.get('userId') || 'local-user';
  
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });
  
  try {
    const filter = encodeURIComponent(`user="${userId}" && log_date="${date}"`);
    const res = await fetch(`${PB_URL}/api/collections/daily_logs/records?filter=${filter}&perPage=1`, {
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
    const filter = encodeURIComponent(`user="${body.user}" && log_date="${body.log_date}"`);
    const checkRes = await fetch(`${PB_URL}/api/collections/daily_logs/records?filter=${filter}&perPage=1`, {
      signal: AbortSignal.timeout(3000),
    });
    
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing.items[0]) {
        // Update
        const updateRes = await fetch(`${PB_URL}/api/collections/daily_logs/records/${existing.items[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(3000),
        });
        const updated = await updateRes.json();
        return NextResponse.json(updated);
      }
    }
    
    // Create new
    const createRes = await fetch(`${PB_URL}/api/collections/daily_logs/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    const created = await createRes.json();
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: 'PocketBase unavailable' }, { status: 503 });
  }
}

export async function GET_ALL(req: NextRequest) {
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
