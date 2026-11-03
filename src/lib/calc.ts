import type { Plan, SavingsGoal } from '../types';

/**
 * All savings math lives here as pure functions of the plan + current time,
 * so every screen shows identical numbers and the logic is easy to test.
 */

export const SECONDS_PER_DAY = 86400;

export function elapsedSeconds(plan: Plan, now: Date = new Date()): number {
  const quit = new Date(plan.quitDate).getTime();
  return Math.max(0, Math.floor((now.getTime() - quit) / 1000));
}

export function elapsedDays(plan: Plan, now: Date = new Date()): number {
  return elapsedSeconds(plan, now) / SECONDS_PER_DAY;
}

/** What the habit used to cost per day, from units bought per week. */
export function dailyCost(plan: Plan): number {
  return (plan.costPerUnit * plan.unitsPerWeek) / 7;
}

export function moneySaved(plan: Plan, now: Date = new Date()): number {
  return dailyCost(plan) * elapsedDays(plan, now);
}

export function puffsAvoided(plan: Plan, now: Date = new Date()): number {
  return Math.floor(plan.puffsPerDay * elapsedDays(plan, now));
}

export function unitsAvoided(plan: Plan, now: Date = new Date()): number {
  return (plan.unitsPerWeek / 7) * elapsedDays(plan, now);
}

/** Banked totals from earlier quit attempts (see store lifetime fields). */
export interface BankedTotals {
  money: number;
  puffs: number;
  units: number;
  freeSeconds: number;
}

/**
 * Lifetime numbers = banked (earlier attempts, never erased) + this run.
 * A slip can restart the current streak; it can never touch these totals.
 */
export function lifetimeMoneySaved(
  plan: Plan,
  banked: BankedTotals,
  now: Date = new Date(),
): number {
  return banked.money + moneySaved(plan, now);
}

export function lifetimePuffsAvoided(
  plan: Plan,
  banked: BankedTotals,
  now: Date = new Date(),
): number {
  return banked.puffs + puffsAvoided(plan, now);
}

export function lifetimeUnitsAvoided(
  plan: Plan,
  banked: BankedTotals,
  now: Date = new Date(),
): number {
  return banked.units + unitsAvoided(plan, now);
}

export function lifetimeFreeSeconds(
  plan: Plan,
  banked: BankedTotals,
  now: Date = new Date(),
): number {
  return banked.freeSeconds + elapsedSeconds(plan, now);
}

// ---------------------------------------------------------------------------
// Taper (cut-down) math. The daily puff budget starts at the user's baseline
// and drops by a fixed percent each week, compounding, until it reaches
// zero or the chosen quit day arrives.
// ---------------------------------------------------------------------------

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isTaperPlan(plan: Plan): boolean {
  return plan.approach === 'taper' && !!plan.taper;
}

/** True while the user is still in the cut-down phase (quit day not reached). */
export function isTaperActive(plan: Plan, now: Date = new Date()): boolean {
  if (!isTaperPlan(plan) || plan.taperCompleted) return false;
  if (now.getTime() >= new Date(plan.taper!.targetQuitDate).getTime()) return false;
  return taperBudgetToday(plan, now) > 0;
}

/** Which taper week a date falls in (0-based). */
export function taperWeekIndex(plan: Plan, date: Date = new Date()): number {
  if (!plan.taper) return 0;
  const start = startOfDay(new Date(plan.taper.startDate)).getTime();
  const day = startOfDay(date).getTime();
  return Math.max(0, Math.floor((day - start) / (7 * SECONDS_PER_DAY * 1000)));
}

/** Puff budget for a given taper week. */
export function taperBudgetForWeek(plan: Plan, weekIndex: number): number {
  if (!plan.taper) return 0;
  const factor = Math.pow(1 - plan.taper.weeklyCutPercent / 100, weekIndex);
  return Math.max(0, Math.round(plan.puffsPerDay * factor));
}

export function taperBudgetToday(plan: Plan, now: Date = new Date()): number {
  return taperBudgetForWeek(plan, taperWeekIndex(plan, now));
}

/**
 * First day the compounding budget rounds to zero, or null when the taper
 * never reaches zero (should not happen for sane cut percents).
 */
export function taperZeroDate(plan: Plan): Date | null {
  if (!plan.taper) return null;
  const start = startOfDay(new Date(plan.taper.startDate));
  for (let w = 0; w <= 520; w++) {
    if (taperBudgetForWeek(plan, w) <= 0) {
      const d = new Date(start);
      d.setDate(d.getDate() + w * 7);
      return d;
    }
  }
  return null;
}

/**
 * The moment a taper flips into a full quit: the earlier of the chosen
 * target quit day and the start of the first zero-budget day.
 */
export function taperFlipMoment(plan: Plan): Date | null {
  if (!plan.taper) return null;
  const target = new Date(plan.taper.targetQuitDate);
  const zero = taperZeroDate(plan);
  if (zero && zero.getTime() < target.getTime()) return zero;
  return target;
}

/** Whole days from now until the taper flips (0 once it has). */
export function daysUntilFlip(plan: Plan, now: Date = new Date()): number {
  const flip = taperFlipMoment(plan);
  if (!flip) return 0;
  return Math.max(
    0,
    Math.ceil((flip.getTime() - now.getTime()) / (SECONDS_PER_DAY * 1000)),
  );
}

/** Percent (0..100) of the savings goal covered by money kept so far. */
export function savingsGoalPercent(
  goal: SavingsGoal | null,
  moneyKept: number,
): number | null {
  if (!goal || goal.price <= 0) return null;
  return Math.min(100, (moneyKept / goal.price) * 100);
}

export interface Projections {
  moneyPerMonth: number;
  moneyPerYear: number;
  unitsPerYear: number;
  puffsPerYear: number;
}

/** Forward-looking numbers shown on the onboarding summary screen. */
export function projections(plan: Plan): Projections {
  const perDay = dailyCost(plan);
  return {
    moneyPerMonth: perDay * (365 / 12),
    moneyPerYear: perDay * 365,
    unitsPerYear: plan.unitsPerWeek * 52,
    puffsPerYear: plan.puffsPerDay * 365,
  };
}

export interface DurationParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function durationParts(totalSeconds: number): DurationParts {
  const s = Math.max(0, Math.floor(totalSeconds));
  return {
    days: Math.floor(s / SECONDS_PER_DAY),
    hours: Math.floor((s % SECONDS_PER_DAY) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** "3d 4h", "5h 12m" etc. Used for streaks and remaining-time labels. */
export function formatDurationShort(totalSeconds: number): string {
  const p = durationParts(totalSeconds);
  if (p.days > 0) return `${p.days}d ${p.hours}h`;
  if (p.hours > 0) return `${p.hours}h ${p.minutes}m`;
  if (p.minutes > 0) return `${p.minutes}m ${p.seconds}s`;
  return `${p.seconds}s`;
}

export function formatMoney(value: number): string {
  if (value >= 1000) {
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatMoneyExact(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCount(value: number): string {
  return Math.floor(value).toLocaleString('en-US');
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
