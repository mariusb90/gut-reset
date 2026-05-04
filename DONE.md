# Gut Reset v2 — Build Complete

**Date:** 2026-05-03  
**Build time:** ~60 minutes  
**Status:** ✅ Done

---

## What Was Built

A full commercial-grade PWA implementing the 14-Day Gut Reset & Microbiome Restoration Protocol.

### Tech Stack
- **Next.js 16.2.4** with App Router (TypeScript)
- **Tailwind CSS v4** with CSS-first `@theme` config
- **Framer Motion** for page transitions and animations
- **Zustand** for global state (app store + log store)
- **PocketBase v0.37.5** running on port 8090 (local SQLite backend)
- **Chart.js + react-chartjs-2** for progress charts
- **Port: 3003**

---

## Phases Built

### Phase 1 — Foundation ✅
- Next.js 15 project at `/home/openclaw/gut-reset-v2`
- Tailwind v4 CSS-first config with full design system
- PocketBase binary at `/home/openclaw/gut-reset-v2/pocketbase/pocketbase`
- All 5 collections created: `user_profiles`, `baselines`, `daily_logs`, `supplement_logs`, `meal_logs`
- Next.js API routes bridging the frontend to PocketBase
- localStorage fallback when PocketBase unavailable

### Phase 2 — Onboarding ✅
7-screen flow:
1. Welcome (sage green full-screen)
2. 3 phases explained (Elimination / Stabilisation / Restoration)
3. Start date picker
4. Goal selection (multi-select)
5. Supplement setup (which ones do you have?)
6. Baseline snapshot (energy/bloating/mood + bowel pattern)
7. Ready screen with CTA

### Phase 3 — Today Tab ✅
- Header with day number + phase color
- Gut Score ring (animated ProgressRing, 0-100)
- Morning check-in view (energy/sleep/supplements)
- Water tracker (tap counter)
- Today's meals (from meal plan, tap to mark eaten)
- Evening wrap-up (gut metrics, compliance, Bristol Stool Scale, notes)
- Completion summary overlay (animated ring + streak + milestone card)
- Streak tracking

### Phase 4 — Meals Tab ✅
- Week 1 / Week 2 selector
- Day-by-day accordion with 5 meal slots
- Each meal: name, full description, prep notes, tap to mark eaten
- Today highlighted

### Phase 5 — Progress Tab ✅
- 14-day line chart (Gut Score)
- Energy / Mood / Sleep multi-line chart
- Bloating trend chart
- 14-day calendar heatmap (green/amber/red)
- Streak and summary stats
- Insights from Day 5+

### Phase 6 — Guide Tab ✅
- Supplements: full detail cards (what it does / dosage / timing / what to look for)
- Exercise guide: Week 1 + Week 2 schedules + yoga poses
- Shopping lists: Week 1 + Week 2 by category
- What to Expect: Days 1-3 / 4-7 / 8-14 / Red Flags
- Foods: Include list + Eliminate list

### Phase 7 — PWA + Polish ✅
- `public/manifest.json` — "Gut Reset" PWA app
- Icons in `/public/icons/`
- Bottom navigation: Today / Meals / Progress / Guide
- Framer Motion transitions throughout
- LocalStorage fallback for offline operation

---

## File Structure

```
/home/openclaw/gut-reset-v2/
├── app/
│   ├── layout.tsx                # Root layout with PWA metadata
│   ├── page.tsx                  # Redirects to onboarding or today
│   ├── globals.css               # Tailwind v4 @theme design system
│   ├── onboarding/page.tsx       # 7-screen onboarding flow
│   ├── today/page.tsx            # Main daily screen
│   ├── meals/page.tsx            # 14-day meal plan
│   ├── progress/page.tsx         # Charts + calendar
│   ├── guide/page.tsx            # Reference content
│   └── api/
│       ├── health/route.ts
│       ├── logs/route.ts
│       ├── logs/all/route.ts
│       ├── supplements/route.ts
│       ├── meals/route.ts
│       ├── profiles/route.ts
│       ├── baselines/route.ts
│       └── init/route.ts
├── components/ui/
│   ├── ProgressRing.tsx          # Animated SVG progress ring
│   ├── MetricSelector.tsx        # 5-tap metric selectors, water tracker
│   ├── Card.tsx                  # Card, PhaseBadge, StreakBadge
│   └── BottomNav.tsx             # 4-tab bottom navigation
├── store/
│   ├── appStore.ts               # Zustand: user profile, settings
│   └── logStore.ts               # Zustand: today's log state
├── lib/
│   ├── pocketbase.ts             # PocketBase client
│   ├── types.ts                  # TypeScript interfaces
│   └── storage.ts                # localStorage fallback
├── data/
│   ├── supplements.ts            # All 10 supplement definitions
│   └── mealPlan.ts               # Full 14-day meal plan
├── pocketbase/
│   ├── pocketbase                # Binary (v0.37.5)
│   ├── start.sh                  # Start PocketBase on 8090
│   └── pb_data/                  # SQLite data directory
├── scripts/
│   └── start-all.sh             # Start PocketBase + Next.js together
└── public/
    ├── manifest.json             # PWA manifest
    └── icons/                    # App icons
```

---

## Running

### Start PocketBase (once per session):
```bash
/home/openclaw/gut-reset-v2/pocketbase/start.sh
```

### Start Next.js:
```bash
cd /home/openclaw/gut-reset-v2 && npm run dev
# or for production:
cd /home/openclaw/gut-reset-v2 && npm start
```

### Start everything:
```bash
/home/openclaw/gut-reset-v2/scripts/start-all.sh
```

**App:** http://localhost:3003  
**PocketBase Admin:** http://localhost:8090/_/  
**PocketBase credentials:** admin@gutresetv2.local / gutresetv2admin!

---

## Verification

- ✅ `npm run build` — passes zero errors
- ✅ PocketBase starts and schema created (5 collections)
- ✅ App serves on port 3003
- ✅ All 5 routes respond: /, /onboarding, /today, /meals, /progress, /guide
- ✅ API health endpoint confirms PocketBase connectivity
- ✅ Onboarding saves to localStorage + PocketBase
- ✅ Today tab shows Gut Score ring
- ✅ All 4 tabs navigate correctly
- ✅ PWA manifest present

---

## Design System

- **Primary:** Sage green `#4A7C59`  
- **Accent:** Amber `#F59E0B`  
- **Background:** `#FAFAF8` (warm off-white)  
- **Radius:** 16px cards, 12px inputs, 9999px pills  
- **Typography:** Inter, 5-size scale  
- **Phase colors:** Elimination `#EF4444`, Stabilisation `#F59E0B`, Restoration `#4A7C59`

---

*Built by Jeev for Alfred / Marius — gut-reset-v2 v1.0*
