# Exhale — Quit Vaping Tracker

A calm, premium companion app for quitting vaping: a live quit timer, money
saved, puffs avoided, a health-recovery milestone timeline, a 3-minute
craving "urge surfing" tool, a journal, achievements, and stats. Offline
first: everything lives on the device, there is no account and no backend.

> **Working name.** "Exhale" is a placeholder chosen for development. Check
> store/trademark availability before any public launch.

## Run it

```bash
npm install
npx expo start
```

Then open it in **Expo Go** (scan the QR code with your phone) or press
`a` / `i` / `w` for Android emulator / iOS simulator / web.

Other scripts:

```bash
npm run typecheck        # tsc --noEmit
npx expo export --platform web   # production bundle smoke test
```

## Stack

- Expo (SDK 58) + React Native + TypeScript
- expo-router (file-based navigation, tabs + modals)
- Zustand for state, persisted to AsyncStorage (`zustand/middleware/persist`)
- expo-notifications for local reminders (daily check-in + milestone alerts)
- Fonts: Fraunces (display) + Archivo (body) via `@expo-google-fonts/*`
- Icons: `@expo/vector-icons` (Ionicons), used sparingly

## How it is organised

```
app/                      expo-router routes
  _layout.tsx             root stack, font loading, notification handler
  index.tsx               entry gate: onboarding vs. tabs, waits for rehydration
  onboarding.tsx          5-step setup: welcome, habit, quit moment, reasons, summary
  sos.tsx                 craving urge-surfing session (modal)
  note.tsx                add a journal note (modal)
  paywall.tsx             Exhale Plus screen, dormant in v1 (modal)
  about.tsx               about + health-information disclaimer (modal)
  (tabs)/
    index.tsx             home dashboard: timer, money kept, ledger, next milestone, SOS
    milestones.tsx        health timeline + achievements grid
    stats.tsx             7-day craving chart, resist record, streaks, money
    journal.tsx           auto entries (resisted / slip / reset) + free notes
    settings.tsx          edit habit numbers, quit date, notifications, reset all data

src/
  types.ts                Plan, CravingEvent, JournalEntry
  theme.ts                palette, font families, spacing, radii
  store/useStore.ts       the single Zustand store (persisted)
  lib/calc.ts             all savings/streak math as pure functions
  lib/milestones.ts       health milestone timeline data + state helpers
  lib/achievements.ts     badge definitions checked against real data
  lib/notifications.ts    permission + scheduling for local reminders
  components/             ui primitives, QuitTimer, BreathingCircle, charts
  services/revenuecat.ts  dormant purchase layer (see below)
```

### Where state lives

One Zustand store (`src/store/useStore.ts`), persisted under the
AsyncStorage key `exhale-state-v1`. It holds the plan, the craving log, the
journal, the longest streak, the relapse count, and the notifications
preference. Everything else (money saved, milestones reached, badges earned,
stats) is **derived** from that data by the pure functions in `src/lib/`,
so numbers agree on every screen and nothing can drift out of sync.

### How the numbers work

- Daily cost = `costPerUnit * unitsPerWeek / 7`; money saved = daily cost
  times days since the quit date.
- Puffs avoided = `puffsPerDay * days elapsed`; pods avoided likewise.
- A slip logged in the SOS flow can reset the quit date; the finished streak
  is banked into `bestStreakSeconds` so "longest streak" survives resets.

## Design notes

House rules, enforced throughout: no glassmorphism, no purple-black
palettes, no glowing orbs, no dot grids, no rainbow gradients, no emojis in
UI copy, no three-cards-in-a-row or bento layouts, no default Inter/Geist
fonts. The look is editorial: warm off-white (`#F7F3EB`), deep pine
(`#14453D`), one amber accent (`#D9932E`), Fraunces display type against
Archivo body text, and ledger-style stat rows with hairline dividers rather
than card grids.

Health milestone copy is phrased as general wellness information (the kind
published by public health sources), never as diagnosis or promise. The
About screen carries the disclaimer and a quit-line number.

## Monetization: deliberately OFF in v1

Exhale is fully free in v1 by the owner's requirement. The paywall screen
exists for design purposes and shows a "coming soon" state; nothing can be
purchased.

To enable RevenueCat later:

1. `npx expo install react-native-purchases`
2. Add the public RevenueCat SDK keys to app config and pass them where
   `configurePurchases()` is documented in `src/services/revenuecat.ts`.
3. Implement the stub functions in that one file (`getOfferings`,
   `purchasePackage`, `getCustomerInfo`). The paywall screen already reads
   its tiers through `getPlusOfferings()`, so no UI changes are needed.

## Verification (as built)

- `npm install` clean
- `npx tsc --noEmit` — passes
- `npx expo export --platform web` — succeeds (all routes exported)
- `npx expo export --platform ios` — succeeds
