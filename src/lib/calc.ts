import type { Plan } from '../types';

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
