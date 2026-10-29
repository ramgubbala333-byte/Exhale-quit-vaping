# Mistless — Quit Vaping Tracker

A calm, premium companion app for quitting vaping: quit now or cut down
first on a weekly taper, a live quit timer, money kept, puffs avoided, a
health-recovery milestone timeline, a four-tool craving SOS toolkit, a
savings goal jar, a journal, achievements, lifetime stats that survive
slips, and a craving trigger heatmap. Offline first: everything lives on
the device, there is no account and no backend.

> **Name.** The display name is **Mistless** (locked). "Exhale" was the
> original project codename and is taken by a competitor, so it survives
> only in internal identifiers: the GitHub repo (`Exhale-quit-vaping`),
> the Expo slug, the Android package / iOS bundle ID, and the
> AsyncStorage key (`exhale-state-v1`). All user-facing strings say
> Mistless.

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
  onboarding.tsx          6-step setup: welcome, habit (nicotine strength,
                          device size, flavour), approach (quit now vs.
                          taper), quit moment, reasons, plan summary
  sos.tsx                 craving toolkit modal: breathing (4-4-4 and
                          4-7-8), 3-minute urge timer, 10-minute delay
                          pledge, swipeable why cards
  note.tsx                add a journal note (modal)
  paywall.tsx             Plus screen, dormant in v1 (modal)
  about.tsx               privacy headline, local-first promise, health
                          disclaimer (modal)
  (tabs)/
    index.tsx             home: quit timer + money kept, or the taper
                          panel (today's puff budget, one-tap logger)
                          while cutting down; savings-goal strip
    milestones.tsx        health timeline (15 milestones) + achievements
                          grid + shareable milestone cards
    stats.tsx             lifetime totals, savings goal jar, 7-day craving
                          chart, trigger heatmap, streaks
    journal.tsx           auto entries (resisted / slip / reset) + free notes
    settings.tsx          edit habit numbers, savings goal, data export,
                          quit date, notifications, reset all data

src/
  types.ts                Plan (incl. taper config), CravingEvent, JournalEntry
  theme.ts                palette, font families, spacing, radii
  store/useStore.ts       the single Zustand store (persisted)
  lib/calc.ts             all savings/streak/taper math as pure functions
  lib/milestones.ts       health milestone timeline data + state helpers
  lib/achievements.ts     badge definitions checked against real data
  lib/notifications.ts    permission + scheduling for local reminders
  components/             ui primitives, MaxWidth, QuitTimer,
                          BreathingCircle, charts, SavingsGoalJar,
                          TriggerHeatmap
  services/revenuecat.ts  dormant purchase layer (see below)
```

### Where state lives

One Zustand store (`src/store/useStore.ts`), persisted under the
AsyncStorage key `exhale-state-v1`. It holds the plan, the craving log,
the journal, the longest streak, the relapse count, the taper puff log,
the savings goal, the notifications preference, and the **lifetime bank**:
money, puffs, devices, and vape-free time banked from every finished
attempt. Everything else (money saved, milestones reached, badges earned,
stats) is **derived** from that data by the pure functions in `src/lib/`,
so numbers agree on every screen and nothing can drift out of sync.

### How the numbers work

- Daily cost = `costPerUnit * unitsPerWeek / 7`; money saved = daily cost
  times days since the quit date.
- Puffs avoided = `puffsPerDay * days elapsed`; pods avoided likewise.
- **A slip is not a reset.** Restarting banks the finished attempt's
  totals into the lifetime bank before the new streak starts, so total
  money kept, total puffs avoided, and longest streak survive forever.
  Only the current streak restarts. The Stats screen shows a Lifetime
  section with the preserved totals.
- **Taper mode.** The user sets a daily puff budget that drops by a
  chosen percentage each week. Home shows today's remaining budget with a
  one-tap puff logger. When the budget reaches zero or the target quit
  day arrives, the plan flips automatically to a full quit with the
  standard timer, and a journal entry marks the cut-down complete.
- **Savings goal.** A goal (name + price) set in Settings is tracked
  against lifetime money kept, shown as a filled jar on Stats and a
  compact progress strip on Home.

## Product policy: the core is never paywalled

The SOS toolkit and the core quit counter are **free forever** and must
never be placed behind a paywall; a code comment in `app/sos.tsx` marks
this. Data export is likewise always free: your record is yours. Any
future Plus tier may only add extras on top of a complete free app.

## Privacy

No account. No tracking. Mistless collects nothing — data never leaves
the phone unless the user exports it from Settings ("Export my data"
produces a JSON of the full store state via the native share sheet).
The About screen leads with this promise.

## Design notes

House rules, enforced throughout: no glassmorphism, no purple-black
palettes, no glowing orbs, no dot grids, no rainbow gradients, no emojis
in UI copy, no three-cards-in-a-row or bento layouts, no default
Inter/Geist fonts. The look is editorial: warm off-white (`#F7F3EB`),
deep pine (`#14453D`), one amber accent (`#D9932E`), Fraunces display
type against Archivo body text, and ledger-style stat rows with hairline
dividers rather than card grids.

Responsive: every tab screen renders inside a shared `MaxWidth` wrapper
that caps content at 600dp and centers it, so nothing stretches
edge-to-edge on tablets; layouts stay intact in landscape and down to
320dp foldable widths, and hero/timer type has capped font scaling
(`maxFontSizeMultiplier` on the display primitive, the quit timer, and
the SOS countdown).

Health milestone copy is phrased as general population-level estimates
(WHO/CDC), not personal measurements, and never as diagnosis, treatment,
or promise; the Milestones tab and About screen carry that framing, and
the About screen states plainly: "Mistless is not a medical device and
does not diagnose, treat, cure, or prevent any medical condition. Talk
to a healthcare professional for medical advice."

## Monetization: deliberately OFF in v1

Mistless is fully free in v1 by the owner's requirement. The paywall
screen exists for design purposes and shows a "coming soon" state;
nothing can be purchased.

To enable RevenueCat later:

1. `npx expo install react-native-purchases`
2. Add the public RevenueCat SDK keys to app config and pass them where
   `configurePurchases()` is documented in `src/services/revenuecat.ts`.
3. Implement the stub functions in that one file (`getOfferings`,
   `purchasePackage`, `getCustomerInfo`). The paywall screen already reads
   its tiers through `getPlusOfferings()`, so no UI changes are needed.

## Verification (latest pass)

- `npx tsc --noEmit` — passes (the root tsconfig excludes the standalone
  `android-build/` APK workspace, which is a separate full copy of the
  project with its own tsconfig)
- `npx expo export --platform web` — succeeds (all routes exported)
