# Mistless — Quit Vaping Tracker

A calm, premium companion app for quitting vaping: quit now or cut down
first on a weekly taper, a live quit timer, money kept, puffs avoided, a
health-recovery milestone timeline, a four-tool craving SOS toolkit, a
savings goal jar, a journal, achievements, lifetime stats that survive
slips, and a craving trigger heatmap. Home carries a rotating daily
line, a last-7-days streak dot row, animated recovery rings (Heart,
Lungs, Energy), and one-time celebration sheets when milestones land;
Stats adds a craving forecast that names your danger window. Offline
first: everything lives on the device, there is no account and no
backend.

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
- react-native-svg for the Home recovery rings (animated with RN Animated)
- Fonts: Fraunces (display) + Archivo (body) via `@expo-google-fonts/*`
- Icons: `@expo/vector-icons` (Ionicons), used sparingly

## How it is organised

```
app/                      expo-router routes
  _layout.tsx             root stack, font loading, notification handler
  index.tsx               entry gate: onboarding vs. tabs, waits for rehydration
  onboarding.tsx          6-step setup: welcome, habit (nicotine strength,
                          device size, multi-select flavour library),
                          approach (quit now vs. taper), quit moment,
                          reasons, plan summary
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
                          while cutting down; daily line, week dots,
                          recovery rings, savings-goal strip, milestone
                          celebration sheets
    milestones.tsx        health timeline (15 milestones) + achievements
                          grid + shareable milestone cards
    stats.tsx             lifetime totals, savings goal jar, 7-day craving
                          chart, trigger heatmap, craving forecast
                          (danger window), streaks
    journal.tsx           auto entries (resisted / slip / reset) + free notes
    settings.tsx          edit habit numbers and flavours, savings goal,
                          data export, quit date, notifications, reset
                          all data

src/
  types.ts                Plan (incl. taper config, flavours array),
                          CravingEvent, JournalEntry
  theme.ts                palette, font families, spacing, radii
  store/useStore.ts       the single Zustand store (persisted)
  lib/calc.ts             all savings/streak/taper math as pure functions
  lib/milestones.ts       health milestone timeline data + state helpers,
                          recovery tracks (Heart / Lungs / Energy ladders)
  lib/flavours.ts         the 44-flavour library in 6 categories +
                          planFlavours() reader (handles legacy data)
  lib/dailyLines.ts       32-line encouragement bank, picked by date
  lib/forecast.ts         craving danger-window computation (peak
                          daypart + hour, needs 5+ logged cravings)
  lib/achievements.ts     badge definitions checked against real data
  lib/notifications.ts    permission + scheduling for local reminders
  components/             ui primitives, MaxWidth, QuitTimer,
                          BreathingCircle, charts, SavingsGoalJar,
                          TriggerHeatmap, RecoveryRings, WeekDots,
                          FlavourPicker, MilestoneCelebration,
                          CravingForecast
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
  against lifetime money kept, shown as a jar on Stats whose amber fill
  animates to the covered percentage, and a compact progress strip on
  Home.
- **Flavours.** Onboarding and Settings offer a 44-flavour library in
  six categories (Fruit, Ice & Mint, Dessert, Drinks, Candy, Tobacco &
  Classics), built from the flavour menus of the major disposable and
  pod brands and retailer best-seller lists, plus a free-text entry.
  Selection is multi-select and stored on the plan as `flavours: string[]`.
  Plans saved by older builds carry a single `flavour` string;
  `planFlavours()` reads both shapes, so old data keeps working.
- **Recovery rings.** Home shows Heart, Lungs, and Energy rings. Each
  track is a ladder of timeline milestones; the percentage is rungs
  passed plus the fraction of the way to the next rung, animated with
  react-native-svg. Same WHO/CDC population-level framing as the
  timeline, footnoted on the section.
- **Milestone celebrations.** When a milestone is newly reached while
  the app is open, a bottom sheet celebrates it once (title, days free,
  money kept, share). Celebrated ids persist in the store, so a
  milestone can never celebrate twice; the first check after install
  seeds the long-past backlog quietly, sparing only the latest
  milestone if it landed within the week.
- **Week dots.** Home renders the last 7 days honestly: filled for a
  vape-free tracked day, amber for a day with a logged slip or restart,
  hollow for days before this quit began; today is ringed.
- **Daily line.** One line per day under the timer, picked
  deterministically by local date from a 32-line bank written for
  quitters (no health promises, no medical advice).
- **Craving forecast.** With 5 or more logged cravings, Stats names
  the danger window from the log itself (busiest daypart and hour,
  e.g. "Most cravings hit in the evening, around 9 PM") and points at
  SOS ahead of it. Below five, the card is an honest placeholder that
  counts progress instead of inventing a pattern.

## v1.3 research pass: engagement systems

Built from an evidence review of what actually moves quit outcomes
(`~/workspace/research_notes/mistless-engagement-ui-research-20261029-2128/report.md`).
Every system is local; there is no backend.

- **If-then craving plans** (`src/lib/plans.ts`, onboarding step +
  Settings manager + SOS). The user pre-decides up to 3 plans: a
  trigger ("After meals", "Stress", "Driving", ...) and a response
  ("Chew gum", "Walk for 5 minutes", "Open SOS and ride the wave").
  Implementation intentions carry a medium-to-large effect on goal
  attainment in meta-analysis (d ≈ 0.65). In SOS the plans are listed,
  and tagging a craving's trigger surfaces the matching plan first.
- **Urge-surf wave** (SOS tool). A 5-minute timer drawn as a wave that
  rises and falls with progress, intensity rated 1–10 before and
  after, with ACT-style acceptance copy ("Notice it. Name it. Let it
  peak and pass."). Acceptance-based urge coping outperformed a
  leading control app in the iCanQuit RCT (OR ≈ 1.49). The log records
  both intensities and the trigger.
- **Lapse rescue, not reset** (SOS slip flow). Three steps: normalize
  (a slip is data, not failure), show everything still banked
  (lifetime money, puffs, resisted cravings, free days across all
  attempts), then one recommit action: an if-then plan for the moment
  that got them, and "Resume my quit". Framing follows the Abstinence
  Violation Effect literature: shame spirals cause relapses, banked
  progress prevents them. Rescues are counted in Stats as
  "Comebacks: N", a point of pride. Lifetime counters never zero.
- **One daily mission** (`src/lib/missions.ts`). A bank of 30 short
  missions, picked deterministically by date. Home shows today's card
  with Done/Skip; skipping carries no guilt copy. Daily-mission
  engagement was the strongest behavioural signal in the Smoke Free
  trial (OR ≈ 1.90 for abstinence among mission users).
- **Endowed-progress plan reveal** (`app/reveal.tsx`). After
  onboarding: "Your plan is already moving", with the three steps the
  user just completed shown as numbered 01/02/03 editorial rows, then
  projections computed from their own inputs only (kept money at 1
  week / 1 month / 6 months / 1 year, puffs avoided at 1 year, first
  milestone named). Reachable again from Settings.
- **Identity votes** (`src/lib/votes.ts`). +1 per resisted craving,
  +1 per completed mission, +1 per full vape-free day. Votes only ever
  accumulate, across attempts. Stats explains: "Every vote is evidence
  for the person you are becoming." Home shows a compact votes pill.
- **Text-a-human** (SOS). An optional support name in Settings; the
  SOS button opens the native SMS/Share composer with an honest
  prewritten message. Mistless never contacts anyone itself.
- **Journal bookends** (`src/lib/prompts.ts`). Morning intention
  (before noon) and evening reflection (after 6 PM) prompt cards in
  the Journal, 12 rotating Stoic-style prompts per slot, opening the
  note editor prefilled. Outside their hours they rest as quiet
  "returns tomorrow" rows.
- **Tailored notifications** (all local, all individually toggleable
  in Settings): a heads-up 30 minutes before the user's known peak
  craving hour (only when forecast data exists), a morning mission
  reminder at a user-chosen time (default 9:00), and a Friday 6 PM
  savings-sweep prompt carrying that week's kept amount. Tailored
  message support is the digital pattern with a real effect (texting
  programmes, RR ≈ 1.54); these are its local-first equivalent.
- **Motion and haptics** (`src/lib/haptics.ts`,
  `src/components/CountUpMoney.tsx`, `MistVeil`). Kept money counts up
  over ~600ms on Home focus, never overshooting. A small haptic
  vocabulary: tick on chip select, tap on primary buttons, commit thud
  on "Log a puff" and mission Done, success pattern on milestone
  reached and craving resisted; all calls are platform-guarded. The
  milestone celebration lands as a seal-stamp (scale 1.6→1 spring, one
  pine ring pulse, under 1.2s, no confetti). Onboarding carries a
  mist-clearing veil: soft off-white SVG bands at the top that thin
  step by step and are gone by the reveal. Reduce-motion (via
  AccessibilityInfo) settles all of it instantly.

Claim discipline throughout: no fabricated social proof, no aggregate
user stats, no medical efficacy claims. Projections are arithmetic on
the user's own numbers and are labelled as such.

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

The paywall's presentation was redesigned in v1.3 as conversion prep
(StoryShort-style anatomy, minus the pressure): a Monthly/Yearly
toggle where Yearly anchors against a struck-through monthly price
and shows the billed-yearly total; placeholder prices as constants at
the top of `app/paywall.tsx` (Monthly $9.99, Yearly $39.99, Lifetime
$59.99, from category research); an outcome block that translates the
tiers into the user's own numbers ("at your pace, you keep about $X a
year"), computed from their plan and logs, never invented averages;
the 2–3 headline Plus capabilities bolded first; a separate
"Free forever" block naming the counter, SOS, rescue and health
timeline as never-paywalled; and the line "Cancel anytime. Keep your
data either way." No user counts, no testimonials, no countdowns, no
pressure mechanics.

To enable RevenueCat later:

1. `npx expo install react-native-purchases`
2. Add the public RevenueCat SDK keys to app config and pass them where
   `configurePurchases()` is documented in `src/services/revenuecat.ts`.
3. Implement the stub functions in that one file (`getOfferings`,
   `purchasePackage`, `getCustomerInfo`), then point the paywall's
   price constants at the live offerings.

## Native build list

Features that need a native (EAS) build rather than Expo Go, in the
order they will be picked up:

1. Home-screen widget: quit timer, money kept, one-tap SOS (owner's
   top native-build priority, set Oct 29, 2026).
2. Optional Google sign-in + cloud backup (Supabase) — after the
   widget; guest mode stays the default and the app keeps collecting
   nothing for guests (owner request Oct 29, 2026).

## Verification (latest pass)

- `npx tsc --noEmit` — passes (the root tsconfig excludes the standalone
  `android-build/` APK workspace, which is a separate full copy of the
  project with its own tsconfig)
- `npx expo export --platform web` — succeeds (all routes exported)
- Flavours + Home glow-up pass: flavour library with legacy migration,
  recovery rings, milestone celebration, animated jar fill, daily line,
  week dots, craving forecast, and warmer empty states all included in
  the two checks above
- v1.3 research pass: if-then plans, urge-surf wave, lapse rescue,
  daily missions, plan reveal, identity votes, text-a-human, journal
  bookends, tailored notifications, haptics + motion, mist-clearing
  onboarding, About FAQ, and the dormant paywall redesign, all covered
  by the same two checks
