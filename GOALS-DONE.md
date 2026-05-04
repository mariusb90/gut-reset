# Goals-Based Personalisation — Done

## What was built

### 1. Today tab — personalised coaching card (`app/today/page.tsx`)
- Added `getGoalCoaching(goals, energy)` function — returns heading + body copy for the user's top priority goal (energy > bloating > digestion > skin > default)
- Renders a subtle card below the Gut Score ring: sage green left border (`#4A7C59`, 3px), light green background (`#F0FAF4`), 💡 icon, small text
- Energy copy includes live energy score (or "starting today" if not yet logged)

### 2. Today tab — Day 7 milestone goal tip (`app/today/page.tsx`)
- Added `getDay7GoalTip(goals)` function — returns a goal-specific sentence
- Injected into both milestone card locations (dashboard inline card + completion overlay card)
- Only renders when `dayNumber === 7`; separated from main milestone text by a subtle top border

### 3. Progress tab — goal highlights (`app/progress/page.tsx`)
- Reads `goals` from `useAppStore()`
- Energy goal → amber `● Your primary goal` badge on the Energy · Mood · Sleep chart header
- Bloating or digestion goal → amber badge on the Bloating Trend chart header
- Skin goal → note under the Bloating chart: "Skin changes often appear in Week 2 — keep logging"

## Build status
`npm run build` — ✓ zero TypeScript errors, all 17 static pages generated

## Changes
All changes are purely additive. No existing components were refactored.
