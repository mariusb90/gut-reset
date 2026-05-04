import { NextResponse } from 'next/server';

const PB_URL = 'http://127.0.0.1:8090';

// Collections to create in PocketBase
const COLLECTIONS = [
  {
    name: 'user_profiles',
    type: 'base',
    fields: [
      { name: 'user', type: 'text', required: true },
      { name: 'start_date', type: 'text' },
      { name: 'goals', type: 'json' },
      { name: 'notifications_enabled', type: 'bool' },
      { name: 'onboarding_complete', type: 'bool' },
      { name: 'configured_supplements', type: 'json' },
    ],
  },
  {
    name: 'baselines',
    type: 'base',
    fields: [
      { name: 'user', type: 'text', required: true },
      { name: 'energy', type: 'number' },
      { name: 'bloating', type: 'number' },
      { name: 'mood', type: 'number' },
      { name: 'bowel_pattern', type: 'text' },
      { name: 'notes', type: 'text' },
    ],
  },
  {
    name: 'daily_logs',
    type: 'base',
    fields: [
      { name: 'user', type: 'text', required: true },
      { name: 'day_number', type: 'number' },
      { name: 'log_date', type: 'text' },
      { name: 'energy', type: 'number' },
      { name: 'mood', type: 'number' },
      { name: 'sleep_quality', type: 'number' },
      { name: 'water_glasses', type: 'number' },
      { name: 'bloating', type: 'number' },
      { name: 'bm_frequency', type: 'number' },
      { name: 'bm_type', type: 'number' },
      { name: 'bm_pain', type: 'text' },
      { name: 'symptoms', type: 'json' },
      { name: 'notes', type: 'text' },
      { name: 'gut_score', type: 'number' },
      { name: 'morning_checked_in', type: 'bool' },
      { name: 'evening_checked_in', type: 'bool' },
      { name: 'fermented_food', type: 'bool' },
      { name: 'bone_broth', type: 'bool' },
      { name: 'eliminated_avoided', type: 'bool' },
      { name: 'exercise_done', type: 'bool' },
      { name: 'exercise_type', type: 'text' },
      { name: 'exercise_duration', type: 'number' },
    ],
  },
  {
    name: 'supplement_logs',
    type: 'base',
    fields: [
      { name: 'user', type: 'text', required: true },
      { name: 'log_date', type: 'text' },
      { name: 'supplement_id', type: 'text' },
      { name: 'taken', type: 'bool' },
    ],
  },
  {
    name: 'meal_logs',
    type: 'base',
    fields: [
      { name: 'user', type: 'text', required: true },
      { name: 'log_date', type: 'text' },
      { name: 'day_number', type: 'number' },
      { name: 'meal_slot', type: 'text' },
      { name: 'eaten', type: 'bool' },
    ],
  },
];

async function adminAuth(): Promise<string | null> {
  try {
    // Try to create admin on first run
    const createRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: 'admin@gutresetv2.local', password: 'gutresetv2admin!' }),
      signal: AbortSignal.timeout(3000),
    });
    if (createRes.ok) {
      const data = await createRes.json();
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

async function createCollections(token: string): Promise<void> {
  for (const collection of COLLECTIONS) {
    try {
      // Check if exists
      const checkRes = await fetch(`${PB_URL}/api/collections/${collection.name}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(3000),
      });
      
      if (checkRes.ok) continue; // Already exists
      
      // Create collection
      await fetch(`${PB_URL}/api/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: collection.name,
          type: collection.type,
          fields: collection.fields,
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: '',
          deleteRule: '',
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Ignore individual collection errors
    }
  }
}

export async function POST() {
  try {
    // Check PB health
    const healthRes = await fetch(`${PB_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    if (!healthRes.ok) {
      return NextResponse.json({ error: 'PocketBase not running' }, { status: 503 });
    }

    const token = await adminAuth();
    if (!token) {
      return NextResponse.json({ error: 'Could not authenticate with PocketBase' }, { status: 500 });
    }

    await createCollections(token);
    
    return NextResponse.json({ ok: true, message: 'PocketBase initialized' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
