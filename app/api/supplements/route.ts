import { NextRequest, NextResponse } from 'next/server';

const PB_URL = 'http://127.0.0.1:8090';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'local-user';
  const date = searchParams.get('date');
  
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });
  
  try {
    const filter = encodeURIComponent(`user="${userId}" && log_date="${date}"`);
    const res = await fetch(`${PB_URL}/api/collections/supplement_logs/records?filter=${filter}&perPage=20`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(data.items || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user, log_date, supplement_id, taken } = body;
  
  try {
    const filter = encodeURIComponent(`user="${user}" && log_date="${log_date}" && supplement_id="${supplement_id}"`);
    const checkRes = await fetch(`${PB_URL}/api/collections/supplement_logs/records?filter=${filter}&perPage=1`, {
      signal: AbortSignal.timeout(3000),
    });
    
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing.items[0]) {
        const updateRes = await fetch(`${PB_URL}/api/collections/supplement_logs/records/${existing.items[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taken }),
          signal: AbortSignal.timeout(3000),
        });
        return NextResponse.json(await updateRes.json());
      }
    }
    
    const createRes = await fetch(`${PB_URL}/api/collections/supplement_logs/records`, {
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
