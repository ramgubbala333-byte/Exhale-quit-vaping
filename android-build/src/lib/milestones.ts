import { elapsedSeconds } from './calc';
import type { Plan } from '../types';

/**
 * Health recovery timeline. Descriptions are general wellness information
 * commonly published by public health sources, phrased non-diagnostically.
 * They describe what many people experience, not a promise for any person.
 */
export interface Milestone {
  id: string;
  /** Seconds after the quit moment when this milestone is reached. */
  offsetSeconds: number;
  /** Short label, e.g. "24 hours". */
  label: string;
  title: string;
  description: string;
}

const MIN = 60;
const HOUR = 3600;
const DAY = 86400;

export const MILESTONES: Milestone[] = [
  {
    id: 'm20min',
    offsetSeconds: 20 * MIN,
    label: '20 minutes',
    title: 'Pulse settling',
    description:
      'Within about 20 minutes of the last puff, heart rate and blood pressure begin easing back toward their normal resting levels.',
  },
  {
    id: 'm8h',
    offsetSeconds: 8 * HOUR,
    label: '8 hours',
    title: 'Oxygen restored',
    description:
      'Carbon monoxide from inhaled aerosol clears from the bloodstream and blood oxygen returns to a normal level.',
  },
  {
    id: 'm24h',
    offsetSeconds: 24 * HOUR,
    label: '24 hours',
    title: 'One full day',
    description:
      'A full day nicotine-free. The body has cleared the carbon monoxide and day one, often the hardest, is behind you.',
  },
  {
    id: 'm48h',
    offsetSeconds: 48 * HOUR,
    label: '48 hours',
    title: 'Nicotine leaves the body',
    description:
      'By around 48 hours nicotine has left the system. Many people notice taste and smell starting to sharpen around now.',
  },
  {
    id: 'm72h',
    offsetSeconds: 72 * HOUR,
    label: '72 hours',
    title: 'Breathing room',
    description:
      'Airways begin to relax and breathing can feel easier. Cravings often peak around this point, then start to fade in intensity.',
  },
  {
    id: 'm1w',
    offsetSeconds: 7 * DAY,
    label: '1 week',
    title: 'Withdrawal fades',
    description:
      'For most people the physical withdrawal symptoms of the first days have eased considerably by the end of week one.',
  },
  {
    id: 'm2w',
    offsetSeconds: 14 * DAY,
    label: '2 weeks',
    title: 'Circulation improving',
    description:
      'Circulation continues to improve over the first two weeks, and walking or exercise often starts to feel noticeably easier.',
  },
  {
    id: 'm1mo',
    offsetSeconds: 30 * DAY,
    label: '1 month',
    title: 'Lungs recovering',
    description:
      'The tiny hairs in the airways that clear mucus begin to regrow and work better, so coughing and shortness of breath often ease.',
  },
  {
    id: 'm3mo',
    offsetSeconds: 90 * DAY,
    label: '3 months',
    title: 'Lung function rising',
    description:
      'Lung function can improve measurably across the first one to nine months, and everyday activities tend to feel less winded.',
  },
  {
    id: 'm6mo',
    offsetSeconds: 180 * DAY,
    label: '6 months',
    title: 'Half a year clear',
    description:
      'Six months in, stress responses to everyday triggers are usually far calmer, and the quit is a habit rather than a daily effort.',
  },
  {
    id: 'm9mo',
    offsetSeconds: 270 * DAY,
    label: '9 months',
    title: 'Deeper lung recovery',
    description:
      'By nine months the lungs have had time to recover substantially, with fewer infections and less congestion for many people.',
  },
  {
    id: 'm1y',
    offsetSeconds: 365 * DAY,
    label: '1 year',
    title: 'One year nicotine-free',
    description:
      'A full year. General health guidance notes that excess risk of coronary heart disease falls to about half of that of someone who still smokes or vapes.',
  },
];

export interface MilestoneState extends Milestone {
  reached: boolean;
  /** ISO time the milestone was/will be hit. */
  at: string;
  /** Seconds remaining when not yet reached. */
  remainingSeconds: number;
}

export function milestoneStates(plan: Plan, now: Date = new Date()): MilestoneState[] {
  const elapsed = elapsedSeconds(plan, now);
  const quitMs = new Date(plan.quitDate).getTime();
  return MILESTONES.map((m) => ({
    ...m,
    reached: elapsed >= m.offsetSeconds,
    at: new Date(quitMs + m.offsetSeconds * 1000).toISOString(),
    remainingSeconds: Math.max(0, m.offsetSeconds - elapsed),
  }));
}

export function nextMilestone(plan: Plan, now: Date = new Date()): MilestoneState | null {
  const states = milestoneStates(plan, now);
  return states.find((s) => !s.reached) ?? null;
}

/** Progress (0..1) from the previous milestone toward the next one. */
export function progressToNext(plan: Plan, now: Date = new Date()): number {
  const elapsed = elapsedSeconds(plan, now);
  const states = MILESTONES;
  let prev = 0;
  for (const m of states) {
    if (elapsed < m.offsetSeconds) {
      return (elapsed - prev) / (m.offsetSeconds - prev);
    }
    prev = m.offsetSeconds;
  }
  return 1;
}
