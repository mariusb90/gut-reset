import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PB = 'http://127.0.0.1:8090'
const COLLECTIONS = ['user_profiles', 'baselines', 'daily_logs', 'supplement_logs', 'meal_logs']

export async function POST() {
  const results: Record<string, number> = {}
  for (const col of COLLECTIONS) {
    try {
      const res = await fetch(`${PB}/api/collections/${col}/records?perPage=200`, { cache: 'no-store' })
      if (!res.ok) { results[col] = 0; continue }
      const data = await res.json()
      const items = data.items ?? []
      let deleted = 0
      for (const item of items) {
        await fetch(`${PB}/api/collections/${col}/records/${item.id}`, { method: 'DELETE', cache: 'no-store' })
        deleted++
      }
      results[col] = deleted
    } catch { results[col] = -1 }
  }
  return NextResponse.json({ ok: true, deleted: results })
}
