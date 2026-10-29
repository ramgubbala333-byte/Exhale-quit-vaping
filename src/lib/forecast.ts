import type { CravingEvent } from '../types';

/**
 * Craving forecast: from the logged craving sessions, name the window
 * of day the cravings cluster in. Daypart boundaries match the trigger
 * heatmap so the two Stats visuals never disagree.
 */

export type DaypartId = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Daypart {
  id: DaypartId;
  /** Lowercase phrase for sentences, e.g. "in the evening". */
  phrase: string;
  /** Capitalized label for headings. */
  label: string;
}

export const DAYPARTS: Daypart[] = [
  { id: 'morning', phrase: 'in the morning', label: 'Morning' },
  { id: 'afternoon', phrase: 'in the afternoon', label: 'Afternoon' },
  { id: 'evening', phrase: 'in the evening', label: 'Evening' },
  { id: 'night', phrase: 'late at night', label: 'Night' },
];

export function daypartOf(d: Date): Daypart {
  const h = d.getHours();
  if (h >= 5 && h < 12) return DAYPARTS[0];
  if (h >= 12 && h < 17) return DAYPARTS[1];
  if (h >= 17 && h < 22) return DAYPARTS[2];
  return DAYPARTS[3];
}

export interface CravingForecast {
  totalCravings: number;
  /** The daypart with the most logged cravings. */
  peakDaypart: Daypart;
  /** How many cravings fell in the peak daypart. */
  peakDaypartCount: number;
  /** The single busiest clock hour inside the peak daypart (0-23). */
  peakHour: number;
  /** Ready-to-render sentence, e.g. "Most cravings hit in the evening, around 9 PM." */
  headline: string;
}

/** Minimum logged cravings before a pattern is worth naming. */
export const FORECAST_MIN_CRAVINGS = 5;

export function cravingForecast(
  cravings: CravingEvent[],
): CravingForecast | null {
  if (cravings.length < FORECAST_MIN_CRAVINGS) return null;

  const daypartCounts = new Map<DaypartId, number>();
  const hourCountsInDaypart = new Map<DaypartId, Map<number, number>>();

  cravings.forEach((c) => {
    const t = new Date(c.timestamp);
    const dp = daypartOf(t);
    daypartCounts.set(dp.id, (daypartCounts.get(dp.id) ?? 0) + 1);
    const hours = hourCountsInDaypart.get(dp.id) ?? new Map<number, number>();
    hours.set(t.getHours(), (hours.get(t.getHours()) ?? 0) + 1);
    hourCountsInDaypart.set(dp.id, hours);
  });

  let peakDaypart = DAYPARTS[0];
  let peakCount = -1;
  DAYPARTS.forEach((dp) => {
    const n = daypartCounts.get(dp.id) ?? 0;
    if (n > peakCount) {
      peakCount = n;
      peakDaypart = dp;
    }
  });

  let peakHour = 0;
  let peakHourCount = -1;
  (hourCountsInDaypart.get(peakDaypart.id) ?? new Map()).forEach((n, h) => {
    if (n > peakHourCount) {
      peakHourCount = n;
      peakHour = h;
    }
  });

  const hourLabel = new Date();
  hourLabel.setHours(peakHour, 0, 0, 0);
  const hourText = hourLabel.toLocaleTimeString('en-US', { hour: 'numeric' });

  return {
    totalCravings: cravings.length,
    peakDaypart,
    peakDaypartCount: peakCount,
    peakHour,
    headline: `Most cravings hit ${peakDaypart.phrase}, around ${hourText}.`,
  };
}
