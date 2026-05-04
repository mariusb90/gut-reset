# IMPROVEMENTS.md — gut-reset-v2

## Backlog

- [2026-05-03] [feat] Goals → personalisation — goals captured in onboarding are stored but not surfaced. Use them to: (1) personalise daily coaching copy on Today tab (e.g. "You said you wanted more energy — here's your energy trend"), (2) highlight the relevant metrics on the Progress tab, (3) show a goal-specific tip card at Day 7 milestone. logged by Alfred
- [2026-05-03] [infra] Add Tailscale serve for port 8445 (gut-reset-v2) — requires `sudo tailscale set --operator=openclaw` once, then Alfred can manage it going forward. Run: `sudo tailscale serve --bg --https=8445 http://localhost:3003` — DONE
- [2026-05-03] [infra] Set `sudo tailscale set --operator=openclaw` so Alfred can manage all Tailscale serve entries without sudo — DONE

## In Progress

_Nothing_

## Done

- [2026-05-03] Full commercial-grade v2 rebuild — PocketBase, Framer Motion, Gut Score ring, 7-screen onboarding, 4-tab nav, Chart.js progress

- [2026-05-03] [feat] Mid-program supplement additions — if you get a supplement after onboarding, you should be able to add it to your active list. Guide tab → Supplements section should show all supplements (not just configured ones), with an "Add to my list" button on unconfigured ones. Adding updates configuredSupplements in Zustand + persists to PocketBase profile. — logged by Alfred

- [2026-05-03] [feat] Supplement suggestions / nudges — on Today tab or Guide tab, when an Essential supplement is NOT in configuredSupplements, show a subtle suggestion card: supplement name, priority badge, one-line reason why it matters at this stage of the reset, link to the supplement detail sheet. "You don't have this yet — worth adding." Don't show for Optional supplements unless user asks. — logged by Alfred
