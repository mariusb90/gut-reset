import { NextRequest, NextResponse } from 'next/server';

const PB_URL = 'http://127.0.0.1:8090';


async function syncProfileSchema() {
  try {
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: 'admin@gutresetv2.local', password: 'gutresetv2admin!' }),
      signal: AbortSignal.timeout(3000),
    });
    if (!authRes.ok) return;
    const { token } = await authRes.json();
    const collectionRes = await fetch(`${PB_URL}/api/collections/user_profiles`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!collectionRes.ok) return;
    const collection = await collectionRes.json();
    const existing = new Set((collection.fields || []).map((f: { name: string }) => f.name));
    const additions = [
      { name: 'age', type: 'number' },
      { name: 'sex', type: 'text' },
      { name: 'weight_kg', type: 'number' },
      { name: 'height_cm', type: 'number' },
      { name: 'activity_level', type: 'text' },
      { name: 'dietary_flags', type: 'json' },
      { name: 'food_dislikes', type: 'json' },
    ].filter(field => !existing.has(field.name));
    if (!additions.length) return;
    const updateRes = await fetch(`${PB_URL}/api/collections/${collection.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields: [...collection.fields, ...additions] }),
      signal: AbortSignal.timeout(5000),
    });
    if (!updateRes.ok) {
      const body = await updateRes.text();
      console.warn('PocketBase profile schema sync failed', updateRes.status, body);
    }
  } catch {
    // Schema sync is best-effort; localStorage fallback still carries the full profile.
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'local-user';
  
  try {
    await syncProfileSchema();
    const filter = encodeURIComponent(`user="${userId}"`);
    const res = await fetch(`${PB_URL}/api/collections/user_profiles/records?filter=${filter}&perPage=1`, {
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
    await syncProfileSchema();
    const filter = encodeURIComponent(`user="${body.user}"`);
    const checkRes = await fetch(`${PB_URL}/api/collections/user_profiles/records?filter=${filter}&perPage=1`, {
      signal: AbortSignal.timeout(3000),
    });
    
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing.items[0]) {
        const updateRes = await fetch(`${PB_URL}/api/collections/user_profiles/records/${existing.items[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(3000),
        });
        return NextResponse.json(await updateRes.json());
      }
    }
    
    const createRes = await fetch(`${PB_URL}/api/collections/user_profiles/records`, {
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
