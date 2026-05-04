# Supplement Features — Done

## Feature 1: Mid-program supplement additions (Guide tab)

**Location:** `app/guide/page.tsx`

- Supplements section now shows **all supplements from the catalog** (not just `configuredSupplements`)
- Supplements already in the user's list: render as before with full expand/collapse and detail sheet
- Supplements NOT in the user's list: rendered with muted styling (faded text, `#F9F9F7` background, `#E5E5E3` border)
  - Small amber "Add +" button in the card header
  - "Add to my list" button also appears inside the expanded detail view
- On "Add to my list" tap:
  1. Calls `setConfiguredSupplements([...current, key])` (Zustand, instant)
  2. POSTs to `/api/profiles` with the updated list (PocketBase upsert)
  3. Shows a green toast: `✓ [Supplement name] added to your list` (2.5s)
  4. Supplement immediately appears in daily checklist (Zustand reactivity)

## Feature 2: Essential supplement suggestions nudge (Today tab)

**Location:** `app/today/page.tsx`

- After the goal coaching card (💡 card), renders a suggestions block **only if** the user is missing any Essential supplements
- Logic: `supplements.filter(s => s.priority === 'Essential' && !configuredSupplements.includes(s.key))`
- Shows max 2 suggestions (shows "N more..." link text if more exist)
- Each suggestion card shows:
  - Supplement name
  - `what_it_does` truncated to ~80 chars
  - Amber "Add +" button — same action as Feature 1 (Zustand update + PocketBase PATCH + toast)
- Styling: amber border (#FCD34D), light amber background (#FFFBEB), compact, non-dominant
- Section not rendered at all if no Essential supplements are missing

## API

`/api/profiles` already supports upsert (POST checks for existing record → PATCH if exists, CREATE if not). No changes needed.

## Build

`npm run build` — zero TypeScript errors, all 17 pages generated successfully.
