/**
 * Identity votes. Every resisted craving, finished mission, and full
 * vape-free day is one "vote" for the person the user is becoming
 * (identity-based habit framing). The count is pure evidence drawn from
 * the user's own record; it is only ever shown as encouragement, and
 * never reversed or weaponised after a lapse: votes are never taken
 * away, even when a streak restarts.
 */

export interface VotesBreakdown {
  total: number;
  fromResisted: number;
  fromMissions: number;
  fromDays: number;
}

export function identityVotes(input: {
  resistedCount: number;
  missionsDone: number;
  /** Total nicotine-free seconds across all attempts (banked + current). */
  lifetimeFreeSeconds: number;
}): VotesBreakdown {
  const fromDays = Math.floor(Math.max(0, input.lifetimeFreeSeconds) / 86400);
  const fromResisted = Math.max(0, input.resistedCount);
  const fromMissions = Math.max(0, input.missionsDone);
  return {
    total: fromResisted + fromMissions + fromDays,
    fromResisted,
    fromMissions,
    fromDays,
  };
}
